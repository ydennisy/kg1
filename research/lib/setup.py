from setuptools import setup, find_packages

setup(
    name="lib",
    version="0.0.1",
    packages=find_packages(),
    install_requires=["openai==1.35.13", "instructor==1.3.4"],
)
