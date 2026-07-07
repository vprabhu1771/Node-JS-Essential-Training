# Check PM2 status
```
pm2 status
```

# If not running, start it
```
pm2 start server.js --name "backend"
```

# Check if port 5000 is listening
```
sudo netstat -tlnp | grep 5000
```
# or
```
sudo ss -tlnp | grep 5000
```
