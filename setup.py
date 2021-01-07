import os
import sys
from setuptools import setup, find_packages

here = os.path.abspath(os.path.dirname(__file__))
README = open(os.path.join(here, 'README.md')).read()
CHANGES = open(os.path.join(here, 'CHANGES.rst')).read()

requires = [
    'PyBrowserID',
    'WSGIProxy2',
    'WebTest',
    'jmespath',
    'future',
    'humanfriendly',
    'netaddr',
    'passlib',
    'psutil',
    'pyramid',
    'pyramid_localroles',
    'pyramid_multiauth',
    'pyramid_tm',
    'python-magic',
    'pytz',
    'setuptools',
    'simplejson',
    'subprocess_middleware',
    'xlrd'
]

if sys.version_info.major == 2:
    requires.extend([
        'backports.functools_lru_cache',
        'subprocess32',
    ])

tests_require = [
    'pytest>=2.4.0',
    'pytest-bdd',
    'pytest-mock',
    'pytest-splinter',
    'pytest_exact_fixtures',
]

setup(
    name='encoded',
    version='80.0',
    description='Metadata database for ENCODE',
    long_description=README + '\n\n' + CHANGES,
    packages=find_packages('src'),
    package_dir={'': 'src'},
    include_package_data=True,
    zip_safe=False,
    author='Laurence Rowe',
    author_email='lrowe@stanford.edu',
    url='http://encode-dcc.org',
    license='MIT',
    install_requires=requires,
    tests_require=tests_require,
    extras_require={
        'test': tests_require,
    },
    entry_points='''
        [console_scripts]
        deploy = encoded.commands.deploy:main

        [paste.app_factory]
        main = encoded:main


        [paste.filter_app_factory]
        memlimit = encoded.memlimit:filter_app
        ''',
)
