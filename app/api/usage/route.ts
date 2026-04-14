import { NextResponse } from 'next/server'

export const revalidate = 300 // 5分キャッシュ

export async function GET() {
  const gistId     = process.env.GIST_ID
  const githubToken = process.env.GITHUB_TOKEN

  if (!gistId) {
    return NextResponse.json({ error: 'GIST_ID not configured' }, { status: 500 })
  }

  try {
    const resp = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: {
        Authorization: `Bearer ${githubToken ?? ''}`,
        Accept: 'application/vnd.github.v3+json',
      },
      next: { revalidate: 300 },
    })

    if (!resp.ok) {
      return NextResponse.json({ error: `GitHub API error: ${resp.status}` }, { status: 502 })
    }

    const gist = await resp.json()
    const raw  = gist.files?.['usage.json']?.content
    if (!raw) {
      return NextResponse.json({ error: 'usage.json not found in Gist' }, { status: 404 })
    }

    return NextResponse.json(JSON.parse(raw))
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
