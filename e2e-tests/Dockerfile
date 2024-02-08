FROM bats/bats

RUN wget https://releases.hashicorp.com/terraform/1.7.3/terraform_1.7.3_linux_amd64.zip && \
    unzip terraform_1.7.3_linux_amd64.zip && \
    mv terraform /usr/local/bin/ && \
    rm terraform_1.7.3_linux_amd64.zip && \
    chmod +x /usr/local/bin/terraform