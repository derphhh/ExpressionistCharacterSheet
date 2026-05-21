exports.handler = async function(event, context) {
  const user = context.clientContext?.user;
  if (!user || !user.email) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Authentication required' })
    };
  }

  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;
  if (!repo || !token) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing GITHUB_REPO or GITHUB_TOKEN environment variables' })
    };
  }

  const [owner, repoName] = repo.split('/');
  if (!owner || !repoName) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'GITHUB_REPO must be in the form owner/repo' })
    };
  }

  const sanitizedEmail = user.email.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
  const filePath = `remote-characters/${sanitizedEmail}.json`;
  const apiUrl = `https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json'
  };

  const fetchContent = async () => {
    const res = await fetch(apiUrl, { headers });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
    return await res.json();
  };

  if (event.httpMethod === 'GET') {
    try {
      const existing = await fetchContent();
      if (!existing) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'No remote save found' })
        };
      }
      const content = Buffer.from(existing.content, 'base64').toString('utf8');
      return {
        statusCode: 200,
        body: content
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message })
      };
    }
  }

  if (event.httpMethod === 'POST') {
    try {
      const payload = JSON.parse(event.body || '{}');
      const jsonString = JSON.stringify(payload, null, 2);
      const encodedContent = Buffer.from(jsonString).toString('base64');
      const existing = await fetchContent();
      const body = {
        message: `Save Expressionist characters for ${user.email}`,
        content: encodedContent,
        committer: {
          name: 'Expressionist Character Sync',
          email: 'noreply@netlify.com'
        }
      };
      if (existing && existing.sha) {
        body.sha = existing.sha;
      }

      const res = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const result = await res.json();
      if (!res.ok) {
        return {
          statusCode: res.status,
          body: JSON.stringify({ error: result.message || 'Failed to save remote data' })
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, path: filePath })
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message })
      };
    }
  }

  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};
