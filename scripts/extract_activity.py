
"""
信息提取工具
"""

import asyncio
import argparse
import sys
import os
import yaml
from pathlib import Path
from typing import List, Dict, Any
from dotenv import load_dotenv
from ai_agent import AIAgentService

load_dotenv()


def load_existing_data(data_dir: Path) -> tuple[List[str], List[str]]:
    """
    加载现有的标签和ID
    
    Args:
        data_dir: 数据目录路径
        
    Returns:
        (标签列表, ID列表)
    """
    all_tags = set()
    all_ids = set()
    
    # 读取所有YAML文件
    for yaml_file in data_dir.glob('*.yml'):
        try:
            with open(yaml_file, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f)
                if not data:
                    continue
                    
                for item in data:
                    # 收集标签
                    if 'tags' in item:
                        all_tags.update(item['tags'])
                    
                    # 收集ID
                    if 'events' in item:
                        for event in item['events']:
                            if 'id' in event:
                                all_ids.add(event['id'])
        except Exception as e:
            print(f'警告: 读取文件 {yaml_file} 失败: {e}', file=sys.stderr)
    
    return sorted(all_tags), sorted(all_ids)


async def extract_from_url(url: str, data_dir: Path) -> None:
    """
    从URL提取活动信息
    
    Args:
        url: 活动网页URL
        data_dir: 数据目录路径
    """
    print(f'\n正在从URL提取活动信息: {url}')
    print('=' * 60)
    
    # 加载现有数据
    existing_tags, existing_ids = load_existing_data(data_dir)
    print(f'已加载 {len(existing_tags)} 个现有标签和 {len(existing_ids)} 个现有ID')
    
    # 创建AI Agent
    agent = AIAgentService()
    
    # 提取信息
    result = await agent.extract_from_url(url, existing_tags, existing_ids)
    
    # 处理结果
    if result['success']:
        print('\n提取成功')
        
        if result.get('warnings'):
            print('\n警告:')
            for warning in result['warnings']:
                print(f'  - {warning}')
        
        # 生成YAML
        yaml_content = agent.to_yaml(result['data'])
        
        print('\n生成的YAML内容:')
        print('=' * 60)
        print(yaml_content)
        print('=' * 60)
        
        # 询问保存
        category = result['data']['category']
        output_file = data_dir / f'{category}s.yml'
        
        save = input(f'\n是否将内容追加到 {output_file}? (y/n): ')
        if save.lower() == 'y':
            with open(output_file, 'a', encoding='utf-8') as f:
                f.write('\n')
                f.write(yaml_content)
                f.write('\n')
            print(f'已保存到 {output_file}')
        else:
            print('已取消保存')
    else:
        print(f'\n提取失败: {result.get("error")}')
        sys.exit(1)


async def extract_from_file(file_path: Path, data_dir: Path) -> None:
    """
    从文件提取活动信息
    """
    print(f'\n正在从文件提取活动信息: {file_path}')
    print('=' * 60)
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            file_content = f.read()
    except Exception as e:
        print(f'读取文件失败: {e}')
        sys.exit(1)
    
    existing_tags, existing_ids = load_existing_data(data_dir)
    print(f'已加载 {len(existing_tags)} 个现有标签和 {len(existing_ids)} 个现有ID')
    
    # 创建Agent
    agent = AIAgentService()
    
    result = await agent.extract_from_file(
        file_content, 
        file_path.name,
        existing_tags, 
        existing_ids
    )
    
    if result['success']:
        print('\n提取成功!')
        
        if result.get('warnings'):
            print('\n警告:')
            for warning in result['warnings']:
                print(f'  - {warning}')
        
        # 生成YAML
        yaml_content = agent.to_yaml(result['data'])
        
        print('\n生成的YAML内容:')
        print('=' * 60)
        print(yaml_content)
        print('=' * 60)
        
        # 询问保存
        category = result['data']['category']
        output_file = data_dir / f'{category}s.yml'
        
        save = input(f'\n是否将内容追加到 {output_file}? (y/n): ')
        if save.lower() == 'y':
            with open(output_file, 'a', encoding='utf-8') as f:
                f.write('\n')
                f.write(yaml_content)
                f.write('\n')
            print(f'已保存到 {output_file}')
        else:
            print('已取消保存')
    else:
        print(f'\n提取失败: {result.get("error")}')
        sys.exit(1)


def main():
    """主函数"""
    parser = argparse.ArgumentParser(
        description='开源活动信息提取工具',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  # 从URL提取
  python extract_activity.py --url https://summer-ospp.ac.cn
  
  # 从文件提取
  python extract_activity.py --file activity.txt
  
  # 指定数据目录
  python extract_activity.py --url https://example.com --data-dir ./data

环境变量:
  GITHUB_TOKEN        GitHub Personal Access Token 
  OPENAI_API_KEY      OpenAI API密钥
  DASHSCOPE_API_KEY   阿里云DashScope API密钥
  AI_PROVIDER         AI提供商 (github/openai/dashscope，默认: github)
  AI_MODEL            AI模型名称 (默认: gpt-4o-mini)
        """
    )
    
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--url', help='活动网页URL')
    group.add_argument('--file', help='活动信息文件路径')
    
    parser.add_argument(
        '--data-dir',
        type=Path,
        default=Path(__file__).parent.parent / 'data',
        help='数据目录路径 (默认: ../data)'
    )
    
    args = parser.parse_args()
    
    # 检查数据目录
    if not args.data_dir.exists():
        print(f'数据目录不存在: {args.data_dir}')
        sys.exit(1)
    
    # 执行提取
    try:
        if args.url:
            asyncio.run(extract_from_url(args.url, args.data_dir))
        else:
            file_path = Path(args.file)
            if not file_path.exists():
                print(f'文件不存在: {file_path}')
                sys.exit(1)
            asyncio.run(extract_from_file(file_path, args.data_dir))
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
