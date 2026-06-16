import yaml from 'yaml'
import fs from 'fs/promises'
import path from 'path'
import { DeadlineItem } from '@/lib/data'

const DATA_REPO_BASE =
  process.env.DATA_REPO_BASE_URL ??
  'https://raw.githubusercontent.com/hust-open-atom-club/open-source-deadlines/main/data'

const REVALIDATE_SECONDS = 60

const DATASETS = ['conferences', 'competitions', 'activities'] as const
type DatasetName = (typeof DATASETS)[number]

async function loadFromRemote(name: DatasetName): Promise<DeadlineItem[]> {
  const res = await fetch(`${DATA_REPO_BASE}/${name}.yml`, {
    next: { revalidate: REVALIDATE_SECONDS, tags: ['events'] },
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch ${name}.yml from remote: ${res.status}`)
  }

  return yaml.parse(await res.text()) as DeadlineItem[]
}

async function loadFromLocal(name: DatasetName): Promise<DeadlineItem[]> {
  const filePath = path.join(process.cwd(), 'data', `${name}.yml`)
  const text = await fs.readFile(filePath, 'utf8')
  return yaml.parse(text) as DeadlineItem[]
}

async function loadOne(name: DatasetName): Promise<DeadlineItem[]> {
  try {
    return await loadFromRemote(name)
  } catch (err) {
    console.warn(
      `[data-source] Remote fetch failed for ${name}, falling back to local file:`,
      err,
    )
    return await loadFromLocal(name)
  }
}

export async function loadDataset(): Promise<DeadlineItem[]> {
  const results = await Promise.all(DATASETS.map((name) => loadOne(name)))
  return results.flat()
}
