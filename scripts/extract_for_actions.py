
"""
GitHub Actions 活动信息提取脚本
"""

import asyncio
import argparse
import sys
import os
import yaml
from pathlib import Path
from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).parent))
from ai_agent import AIAgentService

load_dotenv()


def load_existing_data(data_dir: Path) -> tuple[list[str], list[str]]:
    """加载现有的标签和ID"""
    all_tags = set()
    all_ids = set()
    
    for yaml_file in data_dir.glob('*.yml'):
        try:
            with open(yaml_file, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f)
                if not data:
                    continue
                    
                for item in data:
                    if 'tags' in item:
                        all_tags.update(item['tags'])
                    if 'events' in item:
                        for event in item['events']:
                            if 'id' in event:
                                all_ids.add(event['id'])
        except Exception as e:
            print(f'警告: 读取文件 {yaml_file} 失败: {e}', file=sys.stderr)
    
    return sorted(all_tags), sorted(all_ids)


async def extract_and_save(url: str, data_dir: Path, auto_save: bool = True) -> dict:
    """提取活动信息并自动保存"""
    print(f'\n正在从URL提取活动信息: {url}')
    print('=' * 60)
    
    existing_tags, existing_ids = load_existing_data(data_dir)
    print(f'已加载 {len(existing_tags)} 个现有标签和 {len(existing_ids)} 个现有ID')
    
    agent = AIAgentService()
    
    result = await agent.extract_from_url(url, existing_tags, existing_ids)
    
    if result['success']:
        print('\n提取成功!')
        
        if result.get('warnings'):
            print('\n警告:')
            for warning in result['warnings']:
                print(f'  - {warning}')
        
        yaml_content = agent.to_yaml(result['data'])
        
        print('\n生成的YAML内容:')
        print('=' * 60)
        print(yaml_content)
        print('=' * 60)
        
        category = result['data']['category']
        output_file = data_dir / f'{category}s.yml'
        
        if auto_save:
            with open(output_file, 'a', encoding='utf-8') as f:
                f.write('\n')
                f.write(yaml_content)
                f.write('\n')
            print(f'\n已自动保存到 {output_file}')
            
            return {
                'success': True,
                'title': result['data']['title'],
                'category': category,
                'file': str(output_file)
            }
        else:
            return {
                'success': True,
                'title': result['data']['title'],
                'category': category,
                'yaml': yaml_content
            }
    else:
        print(f'\n提取失败: {result.get("error")}')
        return {
            'success': False,
            'error': result.get('error')
        }


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='GitHub Actions 活动信息提取脚本')
    parser.add_argument('--url', required=True, help='活动网页URL')
    parser.add_argument(
        '--data-dir',
        type=Path,
        default=Path(__file__).parent.parent / 'data',
        help='数据目录路径'
    )
    parser.add_argument(
        '--no-save',
        action='store_true',
        help='不自动保存，仅输出'
    )
    
    args = parser.parse_args()
    
    if not args.data_dir.exists():
        print(f'数据目录不存在: {args.data_dir}')
        sys.exit(1)
    
    try:
        result = asyncio.run(extract_and_save(
            args.url,
            args.data_dir,
            auto_save=not args.no_save
        ))
        
        # 输出结果供 GitHub Actions 使用
        if result['success']:
            print(f'\n::set-output name=title::{result["title"]}')
            print(f'::set-output name=category::{result["category"]}')
            if 'file' in result:
                print(f'::set-output name=file::{result["file"]}')
            sys.exit(0)
        else:
            print(f'\n::error::{result["error"]}')
            sys.exit(1)
            
    except KeyboardInterrupt:
        print('\n\n用户中断')
        sys.exit(1)
    except Exception as e:
        print(f'\n发生错误: {e}')
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()


