# Regulome DB

## Setting up your local environment

These are the primary software versions used in production, and you should be able to use them locally:
- Python 3.8.10
- Node 10
- Ubuntu 20.04

### **0. Xcode for Mac OS build tools**  
- Install [Xcode](https://developer.apple.com/xcode/) from the website or Mac App store because the local build will use some of Xcode's compilation tools.
- Install the Xcode commandline tools (the commandline tools may need to be reinstalled after OS and Xcode updates)
  - `xcode-select --install` 

>:star: _Note_: You will need to open Xcode to accept the end-user agreement from the application, or from the commandline run:_  
>- `sudo xcodebuild -license accept`


### **1. Homebrew for Mac OS package management**  
- Verify that [Homebrew](https://brew.sh/) is installed and working properly:  
  - `brew doctor`


### **2. (Mac) Install or update other dependencies:**

```bash
brew install libevent libmagic libxml2 libxslt openssl graphviz nginx
brew install freetype libjpeg libtiff littlecms webp # chromedriver temporarily broken
pip3 install typing
```
>:star: _Note_: This additional step is required for new macOS Sierra installations
>- `brew cask install Caskroom/cask/xquartz`

>:star: _Note_: **Node version mangement with nvm**: If you need to easily switch between **node** versions you may wish to use [nvm](https://github.com/creationix/nvm) instead (not required for most users)
>- `npm install -g nvm`
>- `nvm install 10`
>- `nvm use 10`
>
>:star: _Note_: **Node version mangement with homebrew**: Switching node versions with homebrew (which is not package manager but not a typical version manager) is possible but is not as flexbible for this purpose, e.g.:
>- `brew install node@7`
>- `brew unlink node@6 && brew link --overwrite --force node@7`
>- `node --version`
>- `brew unlink node@7 && brew link --overwrite --force node@6`
>- `node --version`

>:warning: _Note_: The current version of chromedriver doesn’t allow our BDD tests to pass, so you must install the earlier 2.33 version.
>
> Visit <https://chromedriver.storage.googleapis.com/index.html?path=2.33/> and download chromedriver_mac64.zip to your Downloads folder. Then move the file to /usr/local/bin. Verify you have the correct version installed by then entering:
>
>- `chromedriver --version`
>
> It should show, among other things, that you’re running chromedriver 2.33.

>:warning: _Note_: If you need to update Python dependencies (do not do this randomly as you may lose important brew versions of packages you need):
>- `rm -rf encoded/eggs` (then re-run buildout below)
> and possibly
>- `brew update`
>- `brew upgrade`


### **3. Python**  
Regulome requires a UNIX based system (Mac or Linux) and **Python 3.8.10**:

 - For local development on a Mac, follow the steps below.  For Linux use apt-get or yum as your Linux flavor demands.  You can consult cloud-config.yml for other steps.

- _Note_: Production is currently using the versions above thus your primary development should always work on that version, and you should test that your code works on versions that will be used in production.

- Linux: apt-get install python3.8-dev or equivalent
    
**Mac OSX Python install instructions**  

The Python version management tool `pyenv` is very useful. 

>:warning: _Note: If you have previously installed python3 from homebrew, you may possibly wish to uninstall it (not required):_  
> - `brew uninstall --force python3`


    
**Install `pyenv` and set the default versions:**
```bash 
brew install pyenv
pyenv install 3.8.10
pyenv install 2.7.13
echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.bash_profile
echo 'export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.bash_profile
echo 'eval "$(pyenv init -)"' >> ~/.bash_profile
echo 'eval "pyenv shell 2.7.13 3.8.10"' >> ~/.bash_profile
source ~/.bash_profile
```

>:star: _Note: Migrating `pyenv` Python packages_  
>
>_If you have previously installed a Python version from `pyenv`, and want to quickly migrate all your pypi packages to a new version (Python 2 to 2, and Python 3 to 3 only):_
>  - `brew install pyenv-pip-migrate`  
>    
>Example if you previously installed `2.7` which really is _`2.7.0`_:  
>  - `pyenv install 2.7.13`  
>  - `pyenv migrate 2.7 2.7.13`

>:star: _Note: `pyenv` install fails with "ERROR: The Python ssl extension was not compiled. Missing the OpenSSL lib?" for MAC OS High Sierra
>
>Uninstall and re-install openssl using the following command when you install pyenv
>- `brew uninstall --ignore-dependencies openssl && brew install openssl && CFLAGS="-I$(brew --prefix openssl)/include" LDFLAGS="-L$(brew --prefix openssl)/lib" pyenv install <VERSION>`

**Set the correct Python for the current directory:**
```bash
pyenv local 3.8.10
```

### **4. Run buildout:**

- `pip3 install -U zc.buildout setuptools`
- `pyenv rehash`
- `buildout bootstrap`
- `bin/buildout`

- Edit the key `genomic_data_service_url` on `development.ini` with the correct Genomic Data Services URL.

>:star: _Note_: If you have issues with Pillow you may need to install new xcode command line tools:
> Update or Install [Xcode](https://developer.apple.com/xcode/) from the Mac AppStore (reboot may be required) and re-run:  
> - `xcode-select --install`  


>:star: _Note_: **Clean ALL the Things!** If you wish to **completely rebuild** the application or **cleanly reload** dependencies (:warning: long re-build time!):  
>- `make clean && buildout bootstrap && bin/buildout`


### **5. Start the application locally**


- **Terminal window**:
  In a terminal, run the app with:

  - `bin/pserve development.ini`


### **6. :tada: Check out the app! :tada:**
- Browse to the interface at http://localhost:8000/.

## Running tests

- To run specific tests locally:
    
  `bin/test -k test_name`
    
- To run with a debugger:
    
  `bin/test --pdb`

- Specific tests to run locally for schema changes:

  `bin/test -k test_load_workbook`  
  `bin/test -k test_load_schema`

- Run the Pyramid tests with:

  `bin/test -m "not bdd"`

- Run the Browser tests with:

  `bin/test -m bdd -v --splinter-webdriver chrome`

- Run the Javascript tests with:

  `npm test`

- Or if you need to supply command line arguments:

  `./node_modules/.bin/jest`

- **Test ALL the things!**
  
  `bin/test -v -v --splinter-webdriver chrome && npm test`


## Building Javascript and CSS


Our Javascript is written using ES6 and JSX, so needs to be compiled using babel and webpack. Our CSS is written in the SCSS variant of [Sass](http://sass-lang.com/) and also needs compilation using webpack.

- To re-build **production-ready** bundles, do:

  `npm run build`

  (This is also done as part of running buildout.)

- To build **development** bundles and continue updating them as you edit source files, run:

  `npm run dev`

The development bundles are not minified, to speed up building. The above command runs continually in your terminal window and watches for changes in Javascript and SCSS files, rebuilding the bundles as you make changes.

## Creating a demo machine


- After buildout you (if you have the correct permissions) can run for a single-node "cluster":

  `bin/deploy`
  
  
- The script above will spin up a server in the AWS cloud with the current branch, and with a computed nameserver alias based on the branch and your username.  There are options to use a different branch and/or different instance name and also if you want to use AWS spot instances...and you can specify which AWS profile you want to use.   

  
- Deploy script help (how to specify name, instance size, etc):

  `bin/deploy --help`
      
- For all options, including setting up ES clusters (needed for full production).  After indexing (currently 8+hrs) the machine can be downsized at AWS to an m4.2xlarge, unless you are planning to submit significant data to it.

- The demo link uses this format: https://[instance_name].demo.regulomedb.org/regulome-search/
