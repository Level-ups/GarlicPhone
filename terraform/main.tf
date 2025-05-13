resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "main"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "main"
  }
}

resource "aws_subnet" "public_1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "eu-west-1a"
  map_public_ip_on_launch = true

  tags = {
    Name = "Public Subnet 1"
  }
}

resource "aws_subnet" "public_2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "eu-west-1b"
  map_public_ip_on_launch = true

  tags = {
    Name = "Public Subnet 2"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "Public Route Table"
  }
}

resource "aws_route_table_association" "public_1" {
  subnet_id      = aws_subnet.public_1.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_2" {
  subnet_id      = aws_subnet.public_2.id
  route_table_id = aws_route_table.public.id
}

resource "aws_security_group" "rds_sg" {
  name        = "rds-security-group"
  description = "Security group for RDS PostgreSQL instance"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    security_groups = [aws_security_group.ec2_sg.id]  # Allow EC2 to access RDS
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "rds-postgres-sg"
  }
}

# EC2 Security Group
resource "aws_security_group" "ec2_sg" {
  name = "ec2-security-group"
  description = "Allow SSH and HTTP for EC2"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  ingress {
    description      = "Allow port 5000 (IPv4 & IPv6)"
    from_port        = var.server_port
    to_port          = var.server_port
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  tags = {
    Name = "ec2-postgres-sg"
  }
}

resource "aws_db_subnet_group" "rds_subnet_group" {
  name       = "rds-subnet-group"
  subnet_ids = [aws_subnet.public_1.id, aws_subnet.public_2.id]

  tags = {
    Name = "RDS subnet group"
  }
}

# EC2 Instance
resource "aws_instance" "ec2_instance" {
  ami             = "ami-01ff9fc7721895c6b"
  instance_type   = "t2.micro"
  key_name        = "garlicPhone-key-pair"
  vpc_security_group_ids = [aws_security_group.ec2_sg.id]  # Attach EC2 security group
  subnet_id       = aws_subnet.public_1.id  

  iam_instance_profile = aws_iam_instance_profile.ec2_instance_profile.name # Allow EC2 to access S3 Bucket

  user_data = <<-EOF
              #!/bin/bash
              curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
              source ~/.bashrc
              nvm install 22
              nvm use 22

              wget https://download.red-gate.com/maven/release/com/redgate/flyway/flyway-commandline/11.2.0/flyway-commandline-11.2.0-linux-x64.tar.gz
              tar -xvf flyway-commandline-11.2.0-linux-x64.tar.gz
              sudo mv flyway-11.2.0 /opt/flyway
              export PATH=$PATH:/opt/flyway/flyway-11.2.0
              source ~/.bashrc
              EOF

  tags = {
    Name = "EC2 Instance"
  }
}

# RDS
resource "aws_db_instance" "postgresql" {
  allocated_storage   = 20
  instance_class      = "db.t4g.micro"
  engine              = "postgres"
  engine_version      = "16.4"
  identifier          = "garlicphone-db"
  db_name             = "garlicPhone"
  storage_type        = "gp2"

  username            = var.db_username
  password            = var.db_password
  
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  db_subnet_group_name   = aws_db_subnet_group.rds_subnet_group.name
  
  publicly_accessible    = true
  skip_final_snapshot   = true

  tags = {
    Environment = "development"
  }
}

# S3 Bucket
resource "aws_s3_bucket" "garlicPhone_bucket" {
  bucket = "garlic-phone-bucket"

  tags = {
    Name        = "garlicPhoneS3Bucket"
    Environment = "development"
  }
}

resource "aws_s3_bucket_public_access_block" "public_access" {
  bucket = aws_s3_bucket.garlicPhone_bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "public_read" {
  bucket = aws_s3_bucket.garlicPhone_bucket.id
  policy = data.aws_iam_policy_document.public_read.json
}

data "aws_iam_policy_document" "public_read" {
  statement {
    principals {
      type        = "*"
      identifiers = ["*"]
    }

    actions = [
      "s3:GetObject",
    ]

    resources = [
      "${aws_s3_bucket.garlicPhone_bucket.arn}/*",
    ]
  }
}

resource "aws_iam_role" "ec2_s3_access" {
  name = "ec2-s3-access-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = {
        Service = "ec2.amazonaws.com"
      },
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "s3_access_policy" {
  name = "s3-access-policy"
  role = aws_iam_role.ec2_s3_access.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ],
        Resource = [
          aws_s3_bucket.garlicPhone_bucket.arn,
          "${aws_s3_bucket.garlicPhone_bucket.arn}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_instance_profile" "ec2_instance_profile" {
  name = "ec2-instance-profile"
  role = aws_iam_role.ec2_s3_access.name
}

output "db_endpoint" {
  value = aws_db_instance.postgresql.endpoint
}

output "db_port" {
  value = aws_db_instance.postgresql.port
}

output "db_host" {
  value = aws_db_instance.postgresql.address
}

output "db_database" {
  value = aws_db_instance.postgresql.db_name
}

output "ec2_endpoint" {
  value = aws_instance.ec2_instance.public_dns
  description = "The public DNS of the EC2 instance: "
}

# use environment variables for security
variable "db_username" {
  type      = string
  sensitive = true
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "server_port" {
  type      = number
  sensitive = false
  default = 5000
}