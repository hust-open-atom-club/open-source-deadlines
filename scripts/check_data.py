#!/usr/bin/env python3
import yaml
import sys
import os
import re
from dateutil import parser
from urllib.parse import urlparse
from pytz import timezone, exceptions as pytz_exceptions

# 全局收集器
all_errors = []
all_warnings = []


def record_error(message):
    all_errors.append(message)


def record_warning(message):
    all_warnings.append(message)


def check_activity_structure(activity, file_path):
    required_fields = ['title', 'description', 'category', 'tags', 'events']

    for field in required_fields:
        if field not in activity:
            record_error(f"Error: Missing required field '{field}' in an activity in {file_path}")

    valid_categories = ['competition', 'conference', 'activity']
    if 'category' in activity and activity['category'] not in valid_categories:
        record_error(
            f"Error: Invalid category '{activity['category']}' in {file_path}. "
            f"规范要求: 必须是 {', '.join(valid_categories)}。"
        )

    if 'tags' in activity and not isinstance(activity['tags'], list):
        record_error(f"Error: 'tags' should be a list in {file_path}")

    events = activity.get('events', [])
    if not isinstance(events, list):
        record_error(f"Error: 'events' should be a list in {file_path}")
        return  # 无法继续检查事件

    for event in events:
        if isinstance(event, dict):
            check_event_structure(event, file_path)
        else:
            record_error(f"Error: Event item must be a dictionary in {file_path}")


def check_event_structure(event, file_path):
    required_fields = ['year', 'id', 'link', 'timeline', 'timezone', 'date', 'place']

    for field in required_fields:
        if field not in event:
            record_error(f"Error: Missing required field '{field}' in an event in {file_path}")

    # 检查 link (URL)
    if 'link' in event:
        try:
            parsed_url = urlparse(event['link'])
            if not parsed_url.scheme or not parsed_url.netloc:
                raise ValueError("Invalid URL structure")
        except (ValueError, TypeError) as e:
            record_error(f"Error: Invalid URL '{event['link']}' in {file_path}. Details: {e}")
    else:
        # 已在 required_fields 中检查，此处可省略
        pass

    # 检查 timezone
    event_tz = None
    if 'timezone' in event:
        try:
            if not isinstance(event['timezone'], str):
                record_error(f"Error: 'timezone' must be a string in {file_path}")
            else:
                event_tz = timezone(event['timezone'])
        except pytz_exceptions.UnknownTimeZoneError:
            record_error(
                f"Error: Invalid timezone '{event['timezone']}' in {file_path}. "
                f"规范要求: 请使用标准的 IANA 时区名称 (例如 Asia/Shanghai)。"
            )
        except Exception as e:
            record_error(f"Error: Unexpected error parsing timezone in {file_path}: {e}")
    else:
        # required field, already reported
        pass

    # 检查 timeline
    timeline = event.get('timeline', [])
    if not isinstance(timeline, list) or not timeline:
        record_error(f"Error: 'timeline' should be a non-empty list in {file_path}")
        # 无法继续检查 timeline items
        return

    # 检查 date 格式（宽松检查）
    date_str = event.get('date', '')
    if isinstance(date_str, str):
        chinese_pattern = r'\d{4} *年 *\d+ *月 *\d+ *日'
        english_pattern = r'[a-z]{3,9} \d{1,2}(?:st|nd|rd|th)?(,? \d{4})?'

        is_chinese_format = re.search(chinese_pattern, date_str)
        is_english_format = re.search(english_pattern, date_str, re.IGNORECASE)

        if not (is_chinese_format or is_english_format):
            record_warning(
                f"Warning: 'date' field format might be incorrect in {file_path} for event '{event.get('id', 'unknown')}'. "
                f"规范要求: 请使用人类可读的格式，例如 '2025 年 4 月 30 日'、'April 30, 2025' 或日期范围。"
            )
    else:
        record_error(f"Error: 'date' must be a string in {file_path} for event '{event.get('id', 'unknown')}'")

    # 检查 place
    place_str = event.get('place', '')
    if not isinstance(place_str, str) or not place_str.strip():
        record_error(f"Error: 'place' field cannot be empty in {file_path} for event '{event.get('id', 'unknown')}'.")

    # 检查 timeline items
    last_deadline_aware = None
    for item in timeline:
        if not isinstance(item, dict):
            record_error(f"Error: timeline item must be a dictionary in {file_path} for event '{event.get('id', 'unknown')}'")
            continue

        if 'deadline' not in item or 'comment' not in item:
            record_error(
                f"Error: timeline item in {file_path} for event '{event.get('id', 'unknown')}' "
                f"is missing 'deadline' or 'comment'"
            )
            continue

        deadline_str = item['deadline']
        if not isinstance(deadline_str, str):
            record_error(f"Error: 'deadline' must be a string in timeline item in {file_path}")
            continue

        try:
            current_deadline = parser.isoparse(deadline_str)

            if current_deadline.tzinfo is None or current_deadline.tzinfo.utcoffset(current_deadline) is None:
                if event_tz is not None:
                    current_deadline_aware = event_tz.localize(current_deadline)
                else:
                    # timezone 无效，跳过时序检查
                    continue
            else:
                if event_tz is not None:
                    current_deadline_aware = current_deadline.astimezone(event_tz)
                else:
                    continue

            if last_deadline_aware is not None and current_deadline_aware < last_deadline_aware:
                record_error(
                    f"Error: timeline in {file_path} for event '{event.get('id', 'unknown')}' is not sorted chronologically. "
                    f"Deadline '{deadline_str}' is logically before the previous deadline."
                )

            last_deadline_aware = current_deadline_aware

        except ValueError as e:
            record_error(
                f"Error: Invalid ISO 8601 format for deadline '{deadline_str}' in {file_path}. "
                f"规范要求: 请使用 YYYY-MM-DDTHH:mm:ss 格式，并确保时间合法. Details: {e}"
            )


def main():
    data_dir = os.path.join(os.getcwd(), 'data')

    if not os.path.isdir(data_dir):
        record_error(f"Fatal Error: Data directory not found at '{data_dir}'. Ensure you are running the script from the project root.")
        # 无法继续
        for err in all_errors:
            print(err, file=sys.stderr)
        sys.exit(1)

    data_files = [os.path.join(data_dir, f) for f in os.listdir(data_dir) if f.endswith(('.yml', '.yaml'))]

    if not data_files:
        print("Warning: No YAML files found in the 'data' directory.", file=sys.stderr)
        return

    all_event_ids = set()
    all_tags = set()

    # Load synonyms
    synonyms = {}
    script_dir = os.path.dirname(os.path.abspath(__file__))
    synonyms_path = os.path.join(script_dir, 'synonyms.yml')
    if os.path.exists(synonyms_path):
        try:
            with open(synonyms_path, 'r', encoding='utf-8') as f:
                synonyms_data = yaml.safe_load(f)
                if isinstance(synonyms_data, dict):
                    for key, values in synonyms_data.items():
                        if isinstance(values, list):
                            for value in values:
                                if isinstance(value, str):
                                    synonyms[value] = key
                else:
                    record_error("Error: synonyms.yml must contain a dictionary.")
        except Exception as e:
            record_error(f"Error parsing synonyms.yml: {e}")
    else:
        # 可选：不报错，仅跳过
        pass

    # Process each file
    for file_path in data_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f)
        except yaml.YAMLError as e:
            record_error(f"Error parsing YAML file {file_path}: {e}")
            continue
        except FileNotFoundError:
            record_error(f"Error: File not found: {file_path}")
            continue

        if not isinstance(data, list):
            record_error(f"Error: {file_path} should contain a top-level list of activities.")
            continue

        for item in data:
            if not isinstance(item, dict):
                record_error(f"Error: All top-level items in {file_path} must be dictionaries (activities).")
                continue

            check_activity_structure(item, file_path)

            # Check for duplicate event IDs
            for event in item.get('events', []):
                if isinstance(event, dict) and 'id' in event:
                    eid = event['id']
                    if eid in all_event_ids:
                        record_error(f"Error: Duplicate event ID '{eid}' found in {file_path}.")
                    else:
                        all_event_ids.add(eid)

            # Collect tags
            for tag in item.get('tags', []):
                if isinstance(tag, str):
                    all_tags.add(tag)
                else:
                    record_warning(f"Warning: Non-string tag '{tag}' found in {file_path}. Skipping.")

    # Check for similar tags (case-insensitive + synonyms)
    lower_to_original = {}
    for tag in all_tags:
        canonical_tag = synonyms.get(tag, tag)
        lower_tag = canonical_tag.lower()
        if lower_tag in lower_to_original:
            existing = lower_to_original[lower_tag]
            if existing != canonical_tag:
                record_warning(
                    f"Warning: Possible duplicate tags found: '{existing}' and '{tag}' "
                    f"(both normalize to '{lower_tag}')."
                )
        else:
            lower_to_original[lower_tag] = canonical_tag

    # Output all warnings (to stdout)
    for w in all_warnings:
        print(w)

    # Output all errors (to stderr)
    for e in all_errors:
        print(e, file=sys.stderr)

    # Final decision
    if all_errors:
        sys.exit(1)
    else:
        print("\n✅ All data files passed validation.")
        sys.exit(0)


if __name__ == "__main__":
    main()