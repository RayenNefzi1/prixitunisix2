<?php
// Find admin user and check their password
$pdo = new PDO('pgsql:host=127.0.0.1;port=5432;dbname=prix_tunisix', 'postgres', '050114');

// Find admin user
$user = $pdo->query("SELECT id, email, role FROM users WHERE email = 'admin@prixtunisix.tn'")->fetch(PDO::FETCH_ASSOC);
if ($user) {
    echo "Admin user found: {$user['email']} (role: {$user['role']})\n";
} else {
    echo "No admin user found\n";
}

// Check if we can update password
echo "\nTo reset password, update the users table with a bcrypt hash of your password.";