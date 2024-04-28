-- Create a table to store text node concepts.
create table
  public.text_node_concepts (
    id serial primary key,
    "name" varchar not null
  );

alter table public.text_node_concepts enable row level security;

-- Create a table to connect text nodes to text node concepts, with a many-to-many relationship.
create table 
    public.text_node_to_text_node_concepts (
      text_node_id uuid not null,
      text_node_concept_id int not null,
      primary key (text_node_id, text_node_concept_id),
      foreign key (text_node_id) references public.text_nodes (id),
      foreign key (text_node_concept_id) references public.text_node_concepts (id)
);

alter table public.text_node_to_text_node_concepts enable row level security;

