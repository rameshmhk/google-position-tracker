import subprocess
import os

def deploy():
    ip = "162.243.209.73"
    password = "digital"
    
    # We want to run git pull on the server
    # Since we are on Windows, we might need a way to handle the password
    # However, we can try to use a simple SSH command if sshpass is available (unlikely)
    # Alternatively, we can just print the command for the user to copy-paste
    
    print(f"Attempting to deploy to {ip}...")
    
    # If the user has SSH keys set up, this will work.
    # If not, it will ask for a password.
    # But I will try to use a method that triggers the build on the server if possible.
    
    # Common path for deployment
    remote_path = "/root/google-position-tracker"
    
    cmd = f'ssh root@{ip} "cd {remote_path} && git pull origin master && npm install && npm run build"'
    
    print(f"Running: {cmd}")
    # I cannot interactively provide the password 'digital' via run_command easily.
    # But I can try to use a python pexpect-like logic if available.
    
    # Actually, I'll just try to run it and see if it asks for a password or if it's already authorized.
    # But usually, it fails in a non-interactive shell.
    
if __name__ == "__main__":
    deploy()
