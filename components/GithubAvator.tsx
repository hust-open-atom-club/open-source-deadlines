import Link from 'next/link'

export function GithubAvator() {
    return (
        <Link
            href="https://github.com/hust-open-atom-club/open-source-deadlines"
            target="_blank"
            rel="noopener noreferrer"
            className="border-2 rounded-lg overflow-auto"
            aria-label="GitHub Repository"
        >
            <img
                alt="GitHub Repo stars"
                className="h-8"
                src="https://img.shields.io/github/stars/hust-open-atom-club/open-source-deadlines?style=for-the-badge&logo=github&logoColor=white&labelColor=155dfc&color=white"
            />
        </Link>
    )
}

export default GithubAvator