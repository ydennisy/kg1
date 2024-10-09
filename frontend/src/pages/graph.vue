<script setup lang="ts">
import type { Node, Edge } from '@vue-flow/core';
import { VueFlow } from '@vue-flow/core';
import ConceptNode from '~/components/nodes/ConceptNode.vue';
import ArticleNode from '~/components/nodes/ArticleNode.vue';
import dagre from '@dagrejs/dagre';

// Define node width and height for Dagre layout
const nodeWidth = 200;
const nodeHeight = 200;

// Initialize Dagre graph
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));
dagreGraph.setGraph({
  rankdir: 'LR', // Left to Right; you can try 'TB' for Top to Bottom
  align: 'UR', // Center alignment
  nodesep: 50, // Increase node separation
  ranksep: 100, // Increase rank separation
});

const concepts = [
  {
    name: 'Digital Brain',
    description:
      'An external system for organizing information to enhance memory and creativity.',
    exists_in_documents: [0],
  },
  {
    name: 'Second Brain Methodology',
    description:
      'A method for developing a digital brain using tools and frameworks to manage information.',
    exists_in_documents: [0],
  },
  {
    name: 'Zettelkasten Method',
    description:
      'A note-taking and organization system to create a web of connected knowledge.',
    exists_in_documents: [1, 3],
  },
  {
    name: 'Mind Mapping',
    description:
      'A visual tool used for organizing and connecting knowledge in a spatial format.',
    exists_in_documents: [2, 3],
  },
  {
    name: 'Note-Taking Techniques',
    description:
      'Various methods to take and organize notes for effective learning and recall.',
    exists_in_documents: [3],
  },
  {
    name: 'Memory Retention',
    description:
      'The ability to effectively recall information by organizing and connecting it in meaningful ways.',
    exists_in_documents: [0, 1, 2, 3],
  },
  {
    name: 'Organizational Frameworks',
    description:
      'Structured methods to manage and categorize information for ease of access and creativity enhancement.',
    exists_in_documents: [0, 1, 2, 3],
  },
];

const documents = [
  {
    index: 0,
    title: 'Building a Second Brain: The Definitive Introductory Guide',
    url: 'https://fortelabs.com/blog/basboverview/',
  },
  {
    index: 1,
    title: 'Getting Started • Zettelkasten Method',
    url: 'https://zettelkasten.de/overview/',
  },
  {
    index: 2,
    title: 'The Perfect Mind Map - 4 Step Framework',
    url: 'https://blog.alexanderfyoung.com/the-perfect-mindmap-4-step-framework/',
  },
  {
    index: 3,
    title:
      'The Best Note-Taking Methods for College Students & Serious Note-takers | Goodnotes Blog',
    url: 'https://www.goodnotes.com/blog/note-taking-methods',
  },
];

const nodes = computed<Node[]>(() => {
  const newConceptNodes = concepts.map((concept, idx) => ({
    id: `concept-${idx}`,
    type: 'concept',
    data: { label: concept.name, description: concept.description },
    // Temporary position; will be overridden by Dagre
    position: { x: 0, y: 0 },
  }));

  const articleNodes = documents.map((doc) => ({
    id: `article-${doc.index}`,
    type: 'article',
    data: { label: doc.title, url: doc.url },
    // Temporary position; will be overridden by Dagre
    position: { x: 0, y: 0 },
  }));

  return [...newConceptNodes, ...articleNodes];
});

const edges = computed<Edge[]>(() => {
  const newEdges: Edge[] = [];

  concepts.forEach((concept, conceptIdx) => {
    concept.exists_in_documents.forEach((docIdx) => {
      if (documents.some((doc) => doc.index === docIdx)) {
        newEdges.push({
          id: `e-concept-${conceptIdx}-article-${docIdx}`,
          source: `concept-${conceptIdx}`,
          target: `article-${docIdx}`,
          style: { stroke: '#555' },
        });
      }
    });
  });

  return newEdges;
});

// Apply Dagre Layout
const nodesWithLayoutApplied = computed<Node[]>(() => {
  //const nodes = nodes;
  //const edges = edges;

  // Add nodes to Dagre graph
  nodes.value.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  // Add edges to Dagre graph
  edges.value.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Run the layout
  dagre.layout(dagreGraph);

  // Update node positions based on Dagre layout
  const layouted = nodes.value.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x,
        y: nodeWithPosition.y,
      },
    };
  });

  return layouted;
});
</script>

<template>
  <div style="height: 100vh">
    <VueFlow :nodes="nodesWithLayoutApplied" :edges="edges">
      <template #node-concept="conceptNodeProps">
        <ConceptNode v-bind="conceptNodeProps" />
      </template>

      <template #node-article="articleNodeProps">
        <ArticleNode v-bind="articleNodeProps" />
      </template>
    </VueFlow>
  </div>
</template>

<style>
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';
</style>
