# Regulome DB

## Running app using docker compose

### **1. Running RegulomeDB using docker compose**  

- Make sure you have docker compose (<https://docs.docker.com/compose/install/>) installed. Build the image regulome:
  - `docker compose build`

- Run regulome:
  - `docker compose up`

- The app will be running at <http://0.0.0.0:6543>.

- Stop and remove containers, networks:
  - `docker compose down`

### **2. Frontend development using docker compose**

- In Docker Desktop, find the running docker compose (should be named as "regulome-encoded"), there will be one docker container runing inside. Select the "CLI" to open the terminal:
  - `npm run dev`

- The above command runs continually in the terminal window and watches for changes in Javascript and SCSS files, rebuilding the bundles as you make changes.

### **3. Running test using docker compose**

- Choose the regulome service and run the specific test command, for example:
  - `docker-compose run regulome npm test`

## Creating a demo machine

- Install dependency boto3 first then deploy:

  ```bash
  pip3 install boto3
  python src/encoded/commands/deploy.py --profile-name regulome
  ```

- The demo link uses this format: <https://[instance_name>].demo.regulomedb.org/regulome-search/

- Deploy script help (how to specify name, instance size, etc):

  `python src/encoded/commands/deploy.py --help`

- For all options, including setting up ES clusters (needed for full production).  After indexing (currently 8+hrs) the machine can be downsized at AWS to an m4.2xlarge, unless you are planning to submit significant data to it.

## Linting your code within your code editor

To set up linting with [Sublime Text 3](https://www.sublimetext.com/3) or [Visual Studio Code](https://code.visualstudio.com/), first install the linters:

```bash
pip3 install flake8
npm install -g eslint
npm install -g eslint-plugin-react
```

>:warning: _Note_: You don't have to use Sublime Text 3 but you _must_ ensure that linting in your editor behaves as it does in Sublime Text 3.

### Sublime Text 3

After first setting up [Package Control](https://packagecontrol.io/) (follow install and usage instructions on site), use it to install the following linting packages in Sublime Text 3:

- `sublimelinter`
- `sublimelinter-flake8`
- `SublimeLinter-contrib-eslint` ([Sublime linter eslint instructions](https://github.com/roadhump/SublimeLinter-eslint#plugin-installation))
- `babel` ([Babel instructions](https://github.com/babel/babel-sublime#setting-as-the-default-syntax))

**Sublime Linting with `pyenv`**
To get Sublime to lint Python code using `pyenv` you must add the python version and paths and python_paths to your Sublime Linter Preferences. In **Sublime Text**, navigate to the user linter preferences:  

- Sublime Preferences  -> Package Settings -> Sublime Linter -> Settings-User

- Add the following (modify existing preference settings file or add this entire JSON object below if the file is blank):

```json
{
    "user": {
        "@python": 3.8,
        
        "paths": {
            "linux": [],
            "osx": [
                "/Users/YOURUSERNAME/.pyenv/versions/3.8.10/bin/",
                "/Users/YOURUSERNAME/.pyenv/versions/2.7/bin/"
            ],
            "windows": []
        },
        "python_paths": {
            "linux": [],
            "osx": [
                "/Users/YOURUSERNAME/.pyenv/versions/3.8.10/bin/python3",
                "/Users/YOURUSERNAME/.pyenv/versions/2.7/bin/python"
            ],
            "windows": []
        }
    }
}
```

- Restart Sublime

### Visual Studio Code

Go to the Visual Studio Code marketplace and install these extensions:

- ESLint
- Python
- Sass

## Check versions and linting

**Versions**

- `python3 --version` _returns `Python 3.8.10` (or variant like  3.8.x)_
- `node --version`  _returns `v10.15.0`  (or variant like  v6.x.y)_

**Linting check**

- **Python**: Open Sublime, make a change to a Python file, make an intentional syntax error (no `:` at the end an `if` evaluation). Warnings and errors should show on the left side of the line.
  
- **JavaScript**: Make a syntax error, or style error, in a JS file. Warnings and errors should show on the left side of the line.  
