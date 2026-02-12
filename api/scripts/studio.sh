#!/bin/bash
DATABASE_URL=postgresql://zx_user:zx_password@localhost:5432/zx_op npx prisma studio --url postgresql://zx_user:zx_password@localhost:5432/zx_op
