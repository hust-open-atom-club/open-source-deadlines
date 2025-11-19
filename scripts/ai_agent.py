"""
Agent核心
"""

import os
import re
import json
from typing import Dict, List, Optional, Any
from openai import OpenAI
import httpx

class AIAgentService:
    
    def __init__(self):
        
        self.provider = os.getenv('AI_PROVIDER', 'github')  
        self.model = os.getenv('AI_MODEL', 'gpt-4o-mini')
        
        if self.provider == 'github':
            api_key = os.getenv('GITHUB_TOKEN')
            base_url = 'https://models.inference.ai.azure.com'
            
            if api_key:
                self.openai = OpenAI(api_key=api_key, base_url=base_url)
            else:
                self.openai = None
        elif self.provider == 'dashscope':
            api_key = os.getenv('DASHSCOPE_API_KEY')
            base_url = os.getenv('DASHSCOPE_BASE_URL', 'https://dashscope.aliyuncs.com/compatible-mode/v1')
            
            if api_key:
                self.openai = OpenAI(api_key=api_key, base_url=base_url)
            else:
                self.openai = None
        else:
            api_key = os.getenv('OPENAI_API_KEY')
            if api_key:
                self.openai = OpenAI(api_key=api_key)
            else:
                self.openai = None
    
    async def extract_from_url(
        self, 
        url: str, 
        existing_tags: Optional[List[str]] = None,
        existing_ids: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        从URL提取活动信息
        """
        try:
            existing_tags = existing_tags or []
            existing_ids = existing_ids or []
            
            web_content = await self.fetch_web_content(url)
            return await self.extract_activity_info(web_content, url, existing_tags, existing_ids)
        except Exception as error:
            return {
                'success': False,
                'error': f'Failed to extract from URL: {str(error)}'
            }
    
    async def extract_from_file(
        self,
        file_content: str,
        file_name: str,
        existing_tags: Optional[List[str]] = None,
        existing_ids: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        从文件内容提取活动信息
        """
        try:
            existing_tags = existing_tags or []
            existing_ids = existing_ids or []
            
            processed_content = await self.process_file_content(file_content, file_name)
            return await self.extract_activity_info(processed_content, '', existing_tags, existing_ids)
        except Exception as error:
            return {
                'success': False,
                'error': f'Failed to extract from file: {str(error)}'
            }
    
    async def fetch_web_content(self, url: str) -> str:
        """
        抓取网页内容并清理HTML标签
        """
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers, follow_redirects=True)
            response.raise_for_status()
            
            html = response.text
            
            text_content = re.sub(r'<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>', '', html, flags=re.IGNORECASE)
            text_content = re.sub(r'<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>', '', text_content, flags=re.IGNORECASE)
            
            text_content = re.sub(r'<[^>]+>', ' ', text_content)
            
            text_content = re.sub(r'\s+', ' ', text_content).strip()
            
            return text_content
    
    async def process_file_content(self, file_content: str, file_name: str) -> str:
        """
        处理文件内容（图片OCR预留）
        """
        image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
        is_image = any(file_name.lower().endswith(ext) for ext in image_extensions)
        
        if is_image:
            # 预留OCR处理接口
            return f'[Image file: {file_name}. OCR processing would be applied here in production.]'
        
        return file_content
    
    async def extract_activity_info(
        self,
        content: str,
        source_url: str,
        existing_tags: List[str],
        existing_ids: List[str]
    ) -> Dict[str, Any]:
        """
        使用AI提取活动信息
        """
        if not self.openai:
            if self.provider == 'github':
                provider = 'GitHub Models'
                env_var = 'GITHUB_TOKEN'
            elif self.provider == 'dashscope':
                provider = 'DashScope'
                env_var = 'DASHSCOPE_API_KEY'
            else:
                provider = 'OpenAI'
                env_var = 'OPENAI_API_KEY'
            return {
                'success': False,
                'error': f'{provider} API key not configured. Please set {env_var} environment variable.'
            }
        
        system_prompt = f"""你是一个专业的开源活动信息提取助手。你的任务是从给定的文本中提取开源会议、竞赛或活动的关键信息，并按照指定的JSON格式输出。

【重要】必须返回完整的JSON对象，包含所有必需字段！

必需字段（每个都必须有值）：
{{
  "title": "活动名称（必填）",
  "description": "活动的一句话描述，不超过100字（必填）",
  "category": "必须是以下之一：conference、competition、activity（必填）",
  "tags": ["至少一个标签（必填，数组）"],
  "events": [{{
    "year": 2025,
    "id": "唯一ID，如kaiyuanzhixia-2025（必填）",
    "link": "活动官网URL（必填）",
    "timeline": [{{
      "deadline": "2025-06-01T18:00:00（必填，ISO 8601格式）",
      "comment": "截止说明，如报名截止（必填）"
    }}],
    "timezone": "Asia/Shanghai（必填，IANA时区）",
    "date": "2025 年 6 月 1 日 - 9 月 30 日（必填，人类可读）",
    "place": "线上或线下地点（必填）"
  }}]
}}

【关键规则】：
1. title, description, category, tags, events 都是必填字段
2. category 只能是：conference（会议）、competition（竞赛）、activity（活动）
3. tags 必须是非空数组，至少包含1个标签
4. events 必须是非空数组，至少包含1个事件
5. 每个event必须包含：year, id, link, timeline, timezone, date, place
6. timeline必须是非空数组，至少包含1个时间点
7. 每个timeline项必须包含：deadline（ISO 8601格式）和comment
8. id格式建议：活动拼音-年份，如kaiyuanzhixia-2025
9. timezone使用IANA标准，如Asia/Shanghai
10. date使用中文格式，如"2025 年 6 月 1 日"或"2025 年 6 月 1 日 - 9 月 30 日"
11. 如果提取不到某个必需字段，使用合理的默认值或从上下文推断

【标签建议】（优先使用）：{('、'.join(existing_tags[:20])) if existing_tags else '无'}
【已存在ID】（避免重复）：{('、'.join(existing_ids[:10])) + ('等' if len(existing_ids) > 10 else '') if existing_ids else '无'}

【示例输出】：
{{
  "title": "开源之夏 2025",
  "description": "面向全球开发者的暑期开源活动，鼓励学生参与开源项目开发",
  "category": "competition",
  "tags": ["开源之夏", "学生项目", "暑期活动"],
  "events": [{{
    "year": 2025,
    "id": "kaiyuanzhixia-2025",
    "link": "https://summer-ospp.ac.cn",
    "timeline": [
      {{"deadline": "2025-06-04T18:00:00", "comment": "项目申请截止"}},
      {{"deadline": "2025-09-30T23:59:59", "comment": "项目结项"}}
    ],
    "timezone": "Asia/Shanghai",
    "date": "2025 年 4 月 30 日 - 9 月 30 日",
    "place": "线上"
  }}]
}}"""
        
        if source_url:
            user_prompt = f"请从以下网页内容中提取活动信息：\n\n来源URL: {source_url}\n\n内容：\n{content[:8000]}"
        else:
            user_prompt = f"请从以下内容中提取活动信息：\n\n{content[:8000]}"
        
        try:
            completion = self.openai.chat.completions.create(
                model=self.model,
                messages=[
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': user_prompt}
                ],
                response_format={'type': 'json_object'},
                temperature=0.1
            )
            
            response_content = completion.choices[0].message.content
            if not response_content:
                raise Exception('No response from AI')
            
            print('=== AI原始返回内容 ===')
            print(response_content)
            print('=== 返回内容结束 ===')
            
            extracted_data = json.loads(response_content)
            
            print('=== 解析后的JSON对象 ===')
            print(json.dumps(extracted_data, ensure_ascii=False, indent=2))
            print('=== JSON对象结束 ===')
            
            validation = self.validate_extracted_data(extracted_data, existing_ids)
            
            if not validation['valid']:
                print('=== 数据验证失败 ===')
                print('错误列表:', validation.get('errors'))
                print('=== 验证失败结束 ===')
                return {
                    'success': False,
                    'error': '; '.join(validation.get('errors', [])),
                    'warnings': validation.get('warnings')
                }
            
            return {
                'success': True,
                'data': extracted_data,
                'warnings': validation.get('warnings')
            }
            
        except Exception as error:
            return {
                'success': False,
                'error': f'AI extraction failed: {str(error)}'
            }
    
    def validate_extracted_data(
        self, 
        data: Dict[str, Any], 
        existing_ids: List[str]
    ) -> Dict[str, Any]:
        """
        验证提取的数据
        """
        errors = []
        warnings = []

        if not data.get('title') or not isinstance(data.get('title'), str):
            errors.append('Missing or invalid title')
        
        if not data.get('description') or not isinstance(data.get('description'), str):
            errors.append('Missing or invalid description')
        
        if data.get('category') not in ['conference', 'competition', 'activity']:
            errors.append('Invalid category (must be conference, competition, or activity)')
        
        if not isinstance(data.get('tags'), list) or len(data.get('tags', [])) == 0:
            errors.append('Tags must be a non-empty array')
        
        if not isinstance(data.get('events'), list) or len(data.get('events', [])) == 0:
            errors.append('Events must be a non-empty array')

        if isinstance(data.get('events'), list):
            for index, event in enumerate(data['events']):
                if not event.get('id') or not isinstance(event.get('id'), str):
                    errors.append(f'Event {index}: Missing or invalid id')
                elif event['id'] in existing_ids:
                    errors.append(f'Event {index}: Duplicate ID \'{event["id"]}\'')
                
                if not event.get('year') or not isinstance(event.get('year'), int):
                    errors.append(f'Event {index}: Missing or invalid year')
                
                if not event.get('link') or not isinstance(event.get('link'), str):
                    errors.append(f'Event {index}: Missing or invalid link')
                
                if not isinstance(event.get('timeline'), list) or len(event.get('timeline', [])) == 0:
                    errors.append(f'Event {index}: Timeline must be a non-empty array')
                
                if not event.get('timezone') or not isinstance(event.get('timezone'), str):
                    errors.append(f'Event {index}: Missing or invalid timezone')
        
        return {
            'valid': len(errors) == 0,
            'errors': errors if errors else None,
            'warnings': warnings if warnings else None
        }
    
    def to_yaml(self, data: Dict[str, Any]) -> str:
        """
        将提取的数据转换为YAML格式
        """
        yaml_lines = []
        
        yaml_lines.append(f"- title: {data['title']}")
        yaml_lines.append(f"  description: {data['description']}")
        yaml_lines.append(f"  category: {data['category']}")
        yaml_lines.append('  tags:')
        for tag in data['tags']:
            yaml_lines.append(f'    - {tag}')
        yaml_lines.append('  events:')
        
        for event in data['events']:
            yaml_lines.append(f"    - year: {event['year']}")
            yaml_lines.append(f"      id: {event['id']}")
            yaml_lines.append(f"      link: {event['link']}")
            yaml_lines.append('      timeline:')
            for timeline in event['timeline']:
                yaml_lines.append(f"        - deadline: '{timeline['deadline']}'")
                yaml_lines.append(f"          comment: '{timeline['comment']}'")
            yaml_lines.append(f"      timezone: {event['timezone']}")
            yaml_lines.append(f"      date: {event['date']}")
            yaml_lines.append(f"      place: {event['place']}")
        
        return '\n'.join(yaml_lines)
