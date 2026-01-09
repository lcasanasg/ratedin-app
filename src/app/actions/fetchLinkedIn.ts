'use server'

export interface LinkedInData {
    title?: string
    image?: string
    error?: string
}

export async function fetchLinkedInData(url: string): Promise<LinkedInData> {
    try {
        // Basic validation
        if (!url.includes('linkedin.com/in/')) {
            return { error: 'Invalid LinkedIn URL' }
        }

        // Attempt to fetch with a standard browser User-Agent to mimic a real visitor
        const response = await fetch(url, {
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
            },
            next: { revalidate: 3600 },
        })

        if (!response.ok) {
            return { error: 'Failed to access LinkedIn profile' }
        }

        const html = await response.text()

        // Check if we hit the auth wall
        if (html.includes('auth_wall_desktop') || html.includes('Sign In | LinkedIn')) {
            return { error: 'LinkedIn requires authentication' }
        }

        // Simple regex parsing for OG tags
        const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i)
        const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/i)

        // Clean up title (remove " | LinkedIn")
        const title = titleMatch ? titleMatch[1].replace(' | LinkedIn', '') : undefined

        return {
            title,
            image: imageMatch ? imageMatch[1] : undefined,
        }
    } catch {
        return { error: 'Failed to fetch data' }
    }
}
