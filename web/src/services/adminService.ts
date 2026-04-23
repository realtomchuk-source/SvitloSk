const REPO_OWNER = 'realtomchuk-source';
const REPO_NAME = 'svitlo-starkon';
const WORKFLOW_ID = 'monitor.yml';

export const triggerParserWorkflow = async (token: string, inputs: any) => {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_ID}/dispatches`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ref: 'main',
      inputs
    })
  });

  if (!response.ok && response.status !== 204) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to trigger workflow');
  }

  return true;
};

export const fetchHealthStatus = async () => {
    const response = await fetch(`/data/health.json?t=${Date.now()}`);
    if (!response.ok) throw new Error('Health data not found');
    return response.json();
};

export const fetchParserState = async () => {
    // Note: In development, this might be in web/public/data or relative to parser
    const response = await fetch(`/data/unified_schedules.json?t=${Date.now()}`);
    if (!response.ok) throw new Error('Parser state not found');
    const history = await response.json();
    return history[history.length - 1];
};
