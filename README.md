# simple-folder-sync

## How to Use

1. Clone the repository
2. Install the dependencies via `yarn install`
3. Build the project via `yarn build`
4. Navigate to the folder you wish to run the sync script in.
5. Create a `sync-config.yml` file in the root of the project with the following structure:

    ```yaml
    sync-paths:
    	from/path: to/path
    	another/from/path: another/to/path
    ```

    _Paths support environment variables in the form of `%ENV_VAR%`_

6. Run the project via `node path/to/dist/simple-folder-sync.js`
