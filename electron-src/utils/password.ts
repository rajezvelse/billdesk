import * as bcrypt from 'bcrypt';

// Hashing raw password text
export function encrypt(rawPassword: string): string {

    let hash = bcrypt.hashSync(rawPassword, 10);

    return hash;
}

// Comparing the plain password with the hashed password
export function verify(rawPassword: string, hash: string): boolean {

    let result = bcrypt.compareSync(rawPassword, hash);

    return result;
}