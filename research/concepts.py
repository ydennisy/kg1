import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
from nltk.tag import pos_tag
from nltk.util import ngrams
from sklearn.feature_extraction.text import TfidfVectorizer
from typing import List
import numpy as np

# Download necessary NLTK data
nltk.download('punkt')
nltk.download('stopwords')
nltk.download('averaged_perceptron_tagger')
nltk.download('wordnet')

def extract_top_concepts(documents: List[str], n: int = 5) -> List[str]:
    """
    Extract the top n concepts/tags from a list of documents using advanced NLP techniques.
    
    Args:
    documents (List[str]): A list of document strings.
    n (int): The number of top concepts to extract. Default is 5.
    
    Returns:
    List[str]: A list of the top n concepts/tags, including n-grams.
    """
    lemmatizer = WordNetLemmatizer()
    stop_words = set(stopwords.words('english'))
    
    def preprocess(text):
        tokens = word_tokenize(text.lower())
        lemmatized = [lemmatizer.lemmatize(token) for token in tokens if token.isalpha()]
        tagged = pos_tag(lemmatized)
        return [word for word, pos in tagged if pos.startswith('NN') or pos.startswith('JJ') and word not in stop_words]
    
    def generate_ngrams(tokens, n):
        return [' '.join(ng) for ng in ngrams(tokens, n)]
    
    processed_docs = []
    for doc in documents:
        tokens = preprocess(doc)
        unigrams = tokens
        bigrams = generate_ngrams(tokens, 2)
        trigrams = generate_ngrams(tokens, 3)
        processed_docs.append(' '.join(unigrams + bigrams + trigrams))
    
    # Calculate TF-IDF including n-grams
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(processed_docs)
    feature_names = vectorizer.get_feature_names_out()
    
    # Get the mean TF-IDF score for each term across all documents
    mean_tfidf = np.array(tfidf_matrix.mean(axis=0)).flatten()
    term_scores = {term: score for term, score in zip(feature_names, mean_tfidf)}
    
    # Get the top n concepts, including n-grams
    top_concepts = sorted(term_scores.items(), key=lambda x: x[1], reverse=True)[:n]
    
    # Return only the terms (which may include n-grams)
    return [term for term, _ in top_concepts]

# Example usage
if __name__ == "__main__":
    sample_docs = [
        # Mathematics
        "Calculus is the mathematical study of continuous change.",
        "Linear algebra deals with vector spaces and linear mappings between them.",
        "Number theory is a branch of pure mathematics devoted to the study of integers.",
        "Topology is concerned with the properties of space that are preserved under continuous deformations.",
        "Differential equations describe the rates at which quantities change.",
        
        # Artificial Intelligence
        "Machine learning is a subset of artificial intelligence focused on data-driven algorithms.",
        "Natural language processing helps computers understand and generate human language.",
        "Computer vision enables machines to interpret and make decisions based on visual data.",
        "Reinforcement learning is an area of machine learning concerned with how agents take actions in an environment.",
        "Neural networks are computing systems inspired by biological neural networks in animal brains.",
        
        # Physics
        "Quantum mechanics is a fundamental theory in physics that describes nature at the smallest scales of energy levels of atoms and subatomic particles.",
        "Relativity is the notion that the laws of physics are the same everywhere in the universe.",
        "Thermodynamics deals with heat and temperature, and their relation to energy and work.",
        "Astrophysics is the branch of astronomy that employs the principles of physics to understand celestial objects.",
        "Particle physics is the branch of physics that studies the nature of particles that constitute matter and radiation.",
        
        # Computer Science
        "Algorithms are step-by-step procedures for solving problems or accomplishing tasks in computing.",
        "Data structures are specialized formats for organizing and storing data in computers.",
        "Operating systems manage computer hardware, software resources, and provide common services for computer programs.",
        "Cryptography is the practice and study of techniques for secure communication in the presence of adversaries.",
        "Parallel computing is a type of computation in which many calculations or processes are carried out simultaneously."
    ]
    
    top_10_concepts = extract_top_concepts(sample_docs, 10)
    print(f"Top 10 concepts: {top_10_concepts}")
