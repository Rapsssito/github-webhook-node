# How to use

##### 1. Run the server

```
$ node index.js <port> <secret> <path_to_script>
```
_Note_: `<path_to_script>` is the path to a bash (.sh) script

##### 2. Configure Webhook at GitHub repository Settings

Payload URL is http://ADDRESS:PORT/push  
Enter the secret key that you have entered in index.js
