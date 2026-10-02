# End-to-End Encryption

<!-- Maintained by Tidewiki. Edits are kept on later updates; wrap text in tidewiki:keep markers to freeze it. -->

This page covers how data is encrypted and decrypted, how encryption keys are managed, and how encrypted state is handled throughout the application.

## Encryption Algorithm and Parameters

The application uses **AES-GCM** (Advanced Encryption Standard in Galois/Counter Mode) for symmetric encryption. AES-GCM is chosen because it provides both confidentiality and authenticity—it detects if the ciphertext has been modified by an attacker [`packages/excalidraw/data/encryption.ts:66-67`](../../packages/excalidraw/data/encryption.ts#L66-L67).

Encryption keys are generated with a fixed length of `ENCRYPTION_KEY_BITS` (defined in `@excalidraw/common`). Each encryption operation uses a unique **initialization vector (IV)** of 12 bytes, generated with cryptographically secure random values [[cite:packages/excalidraw/data/encryption.ts:5,7-10]].

## Key Generation

The `generateEncryptionKey` function creates a new encryption key using the Web Crypto API [`packages/excalidraw/data/encryption.ts:12-30`](../../packages/excalidraw/data/encryption.ts#L12-L30). The function can return the key in two formats:

- **`"cryptoKey"`**: Returns a `CryptoKey` object ready for immediate use in encryption/decryption operations
- **`"string"`**: Exports the key in JWK (JSON Web Key) format, encoding it as a string for storage or transmission

The key is marked as extractable during generation, allowing it to be exported for storage, but is non-extractable when imported for use [[cite:packages/excalidraw/data/encryption.ts:22,46]].

## Key Import and Management

The `getCryptoKey` function converts a stored key string back into a `CryptoKey` object [`packages/excalidraw/data/encryption.ts:32-48`](../../packages/excalidraw/data/encryption.ts#L32-L48). It accepts a `usage` parameter (`"encrypt"` or `"decrypt"`) to restrict the key's purpose in that specific operation. The key is imported in JWK format with algorithm details matching the AES-GCM specification.

## Encryption

The `encryptData` function encrypts data of various types—strings, `Uint8Array`, `ArrayBuffer`, `Blob`, or `File`—into an encrypted buffer and IV [`packages/excalidraw/data/encryption.ts:50-78`](../../packages/excalidraw/data/encryption.ts#L50-L78).

The function:
1. Converts the key to a `CryptoKey` if provided as a string
2. Generates a fresh IV for this encryption
3. Normalizes input data to an `ArrayBuffer` or `Uint8Array` (converting strings via `TextEncoder`, blobs via `blobToArrayBuffer`)
4. Encrypts the buffer using AES-GCM
5. Returns both the encrypted buffer and the IV (the IV must be stored or transmitted alongside the ciphertext since it is not secret)

## Decryption

The `decryptData` function reverses encryption, taking an IV, encrypted data, and the private key string [`packages/excalidraw/data/encryption.ts:80-94`](../../packages/excalidraw/data/encryption.ts#L80-L94). It imports the key, then decrypts using AES-GCM. On successful decryption, it returns the plaintext `ArrayBuffer`. If the ciphertext has been tampered with, the AES-GCM algorithm will fail the authentication check and throw an error.

## Integration with Storage and Collaboration

Encrypted data must be paired with its IV for later decryption. When persisting encrypted documents or transmitting them over the network in [Real-Time Collaboration](collaboration.md), both the ciphertext and IV are required. The [File Formats and Data Restoration](file-formats-restore.md) page describes how encrypted state is structured in saved documents.
