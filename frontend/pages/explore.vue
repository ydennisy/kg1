<script setup lang="ts">
import { use } from 'echarts/core';
import { ScatterChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DataZoomComponent,
  DataZoomInsideComponent,
  DataZoomSliderComponent,
  ToolboxComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import VChart from 'vue-echarts';

interface VisualNode {
  id: string;
  x: number;
  y: number;
  title: string;
  cluster: number;
}

use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DataZoomComponent,
  DataZoomInsideComponent,
  DataZoomSliderComponent,
  ToolboxComponent,
  ScatterChart,
  CanvasRenderer,
]);

const config = useRuntimeConfig();
const apiBase = config.public.apiBase;

const nodes = ref<VisualNode[]>([]);

const fetchNodes = async () => {
  const token = useSupabaseSession().value?.access_token;
  const { data } = await useFetch<VisualNode[]>(`${apiBase}/api/explore`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!data.value) {
    nodes.value = [];
    return;
  } else {
    nodes.value = data.value;
  }
};

const chartOptions = computed(() => ({
  tooltip: {
    formatter: function (params: { dataIndex: number }) {
      const node = nodes.value[params.dataIndex];
      return `ID: ${node.id}<br>Title: ${node.title}<br>Cluster: ${node.cluster}`;
    },
  },
  xAxis: {
    type: 'value',
  },
  yAxis: {
    type: 'value',
  },
  toolbox: {
    feature: {
      dataZoom: {},
    },
  },
  dataZoom: [
    {
      type: 'inside',
      xAxisIndex: 0,
      yAxisIndex: 0,
      filterMode: 'empty',
    },
  ],
  series: [
    {
      type: 'scatter',
      data: nodes.value.map((node) => [node.x, node.y]),
      symbolSize: 7,
      itemStyle: {
        color: 'var(--color-secondary)',
      },
    },
  ],
}));

onMounted(async () => {
  await fetchNodes();
});
</script>

<template>
  <h1 class="text-xl text-gray-800 mt-2 mb-2">Explore your nodes</h1>
  <div class="p-2">
    <v-chart class="w-full h-[600px]" :option="chartOptions" autoresize />
  </div>
</template>
