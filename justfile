[working-directory: 'frontend']
frontend:
    npm run dev

[working-directory: 'rust_functions']
setup-rust:
    npm install
    npm run build

[working-directory: 'backend']
backend:
    docker compose up -d
    npm run dev

    
