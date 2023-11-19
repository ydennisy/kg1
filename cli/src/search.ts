import axios from 'axios';

const BASE_URL = process.env.BASE_URL;

const search = async (q: string): Promise<void> => {
  try {
    const { data } = await axios.get(`${BASE_URL}/search`, {
      params: {
        q,
      },
    });
    console.table(data);
  } catch (err: any) {
    if (err.response && err.response.status === 429) {
      console.error(`${err.response.data.message} | ${err.response.status}`);
    }
  }
};

export { search };
