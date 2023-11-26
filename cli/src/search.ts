import axios from 'axios';
import chalk from 'chalk';

interface SearchResultRow {
  id: string;
  title: string;
  type: 'NOTE' | 'WEB_PAGE' | 'PAPER';
}

const BASE_URL =
  process.env.BASE_URL || 'https://kg1-backend-j5dxapaafq-ew.a.run.app';

const search = async (q: string): Promise<void> => {
  try {
    const { data } = await axios.get<SearchResultRow[]>(`${BASE_URL}/search`, {
      params: {
        q,
      },
    });
    const nodes = data.reduce((acc, { id, ...x }) => {
      acc[id] = x;
      return acc;
    }, {} as Record<string, object>);

    console.log(`✅ ${chalk.green(`Succesfully searched for: "${q}"`)}`);
    console.log();
    console.table(nodes);
  } catch (err: any) {
    if (err.response && err.response.status === 429) {
      console.error(
        `❌ ${chalk.red('Failed to add node(s).')} | ${err.response.status} | ${
          err.response.data.message
        }`,
      );
    }
  }
};

export { search };
