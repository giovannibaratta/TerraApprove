sleep $(shuf -i 0-5 -n 1)

# Install lockfile contained in procmail
# The installation is performed using floc because this script will be called by multiple processes
flock /tmp/installdependencies.lock -c "sudo apt-get update && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y procmail"

# Create a lockfile to avoid multiple execution of this script
lockfile /tmp/configureapt.lock

echo "Lock for configuring apt has been acquired"

# Assumption: the configuration is correct if the file already exists
if [[ ! -f /etc/apt/apt.conf ]]; then
    echo "Configuring apt..."

    # Do not throw error if lock can not be acquire and wait for it
    echo 'DPkg::Lock::Timeout "-1";' | sudo tee /etc/apt/apt.conf > /dev/null
    # Since there are script that use apt, and there is no control over, add pre and post invoke to use a lock when running apt-get update and apt-get install.
    echo 'DPkg::Pre-Invoke {"(which lockfile && lockfile /tmp/apt.lock) || true"};' | sudo tee -a /etc/apt/apt.conf > /dev/null
    echo 'DPkg::Post-Invoke {"rm -f /tmp/apt.lock"};' | sudo tee -a /etc/apt/apt.conf > /dev/null
    echo 'APT::Update::Pre-Invoke {"(which lockfile && lockfile /tmp/apt.lock) || true"};' | sudo tee -a /etc/apt/apt.conf > /dev/null
    echo 'APT::Update::Post-Invoke {"rm -f /tmp/apt.lock"};' | sudo tee -a /etc/apt/apt.conf > /dev/null
else
    echo "Apt has already been configured"
fi

rm -f /tmp/configureapt.lock

echo "Lock for configuring apt has been released"