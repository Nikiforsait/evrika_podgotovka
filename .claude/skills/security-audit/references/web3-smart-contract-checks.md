# Web3 & Smart Contract Security Checks

Reference file for Web3 applications, smart contracts (Solidity/Rust), and dApp security patterns. Used across Phases 4 and 7.

---

## Smart Contract Security — Solidity

### Critical

**Reentrancy Vulnerability**
- Pattern: `\.call\{value:.*\}\(` or `.send(` or `.transfer(` preceding state variable updates
- Pattern: External call followed by state change without `nonReentrant` modifier
- Check: `function\s+\w+.*external.*\{` bodies where `.call{value` appears before storage writes
- Risk: Attacker contract re-enters function before state is updated, draining funds (e.g., The DAO hack)
- Remediation: Use checks-effects-interactions pattern; apply OpenZeppelin `ReentrancyGuard` (`nonReentrant` modifier); update state BEFORE external calls

**Integer Overflow/Underflow**
- Pattern (pre-0.8): `pragma solidity \^?0\.[4-7]\.` without `using SafeMath for uint`
- Pattern: `unchecked\s*\{` blocks containing arithmetic on user-supplied values
- Pattern: `uint\d*\s+\w+\s*=\s*\w+\s*[\-\+\*]` inside `unchecked` blocks
- Risk: Wrapping arithmetic allows attackers to mint tokens, bypass balance checks, or manipulate voting
- Remediation: Use Solidity >= 0.8.0 for built-in overflow checks; avoid `unchecked` blocks on untrusted input; use OpenZeppelin SafeMath for older versions

**Missing Access Control**
- Pattern: `function\s+\w+.*public|external` without `onlyOwner|onlyRole|onlyAdmin|require\(msg\.sender`
- Pattern: `tx\.origin` used for authentication — `require\(tx\.origin\s*==`
- Pattern: State-changing functions without any `require(msg.sender` or modifier
- Risk: Unauthorized users call admin functions; `tx.origin` is spoofable via phishing contracts
- Remediation: Use OpenZeppelin `Ownable` or `AccessControl`; NEVER use `tx.origin` for auth; use `msg.sender` exclusively

**Delegatecall to Untrusted Contract**
- Pattern: `\.delegatecall\(` with user-supplied or non-constant address
- Pattern: `delegatecall\(abi\.encodeWithSignature\(` where target is a variable
- Risk: Delegatecall runs external code in the caller's storage context — attacker can overwrite owner, drain funds
- Remediation: Only delegatecall to trusted, immutable, or verified addresses; use proxy patterns from OpenZeppelin

**Flash Loan Attack Vectors**
- Pattern: Price calculations using spot balances — `balanceOf\(address\(this\)\)` in price/ratio logic
- Pattern: Single-block oracle reads — `getReserves\(\)` or `slot0\(\)` without TWAP
- Risk: Attacker manipulates pool reserves within a single transaction to exploit price-dependent logic
- Remediation: Use time-weighted average prices (TWAP); use Chainlink oracles; avoid spot balance for pricing

**Oracle Manipulation**
- Pattern: `latestAnswer\(\)` without freshness check — missing `updatedAt` or `answeredInRound` validation
- Pattern: `getReserves\(\)` used directly for pricing without TWAP
- Pattern: Single oracle source without fallback
- Risk: Stale or manipulated price feeds lead to incorrect liquidations, mispricing, or arbitrage
- Remediation: Check `updatedAt` timestamp and `answeredInRound >= roundId`; use TWAP; implement circuit breakers; use multiple oracle sources

**Unchecked Low-Level Call Return Value**
- Pattern: `\.call\{` or `\.call\(` without `(bool success,` check or `require(success`
- Pattern: `address\(\w+\)\.call` where return value is discarded
- Risk: Failed transfers silently succeed, leading to accounting errors or locked funds
- Remediation: Always check return value — `(bool success, ) = addr.call{value: amt}(""); require(success);`

### High

**Self-Destruct Accessible by Non-Owner**
- Pattern: `selfdestruct\(` or `suicide\(` in functions without access control
- Pattern: `selfdestruct\(payable\(` without `onlyOwner` or `require(msg.sender`
- Risk: Attacker destroys contract and redirects remaining ETH
- Remediation: Restrict `selfdestruct` to owner-only; consider removing it entirely (deprecated in EIP-6049)

**Front-Running / MEV Vulnerability**
- Pattern: Predictable state changes — `approve\(` followed by `transferFrom\(` pattern
- Pattern: Commit-reveal schemes missing — auction bids or votes visible in mempool
- Pattern: `block\.timestamp` or `block\.number` used for randomness
- Risk: Miners/searchers reorder or sandwich transactions for profit; predictable randomness exploited
- Remediation: Use commit-reveal schemes; use Flashbots Protect for MEV resistance; use Chainlink VRF for randomness

**Uninitialized Storage Pointers**
- Pattern (pre-0.5): `\w+\s+storage\s+\w+;` local variable declared as storage without assignment
- Pattern: Struct declared in function body defaulting to storage in older Solidity
- Risk: Uninitialized storage pointer overwrites arbitrary storage slots
- Remediation: Use Solidity >= 0.5.0 (compiler enforces explicit data location); always initialize storage references

**Upgradeable Proxy Without Proper Access Control**
- Pattern (UUPS): `function upgradeTo` without `onlyOwner` or `_authorizeUpgrade` lacking access check
- Pattern: `_authorizeUpgrade\(.*\)\s*(internal|public).*\{\s*\}` — empty authorization function
- Pattern (Transparent): `ProxyAdmin` deployed without multisig as owner
- Risk: Unauthorized upgrade replaces implementation with malicious contract
- Remediation: Protect `_authorizeUpgrade` with `onlyOwner`; use multisig as ProxyAdmin owner; use OpenZeppelin UUPS pattern

**Storage Collision in Proxy Patterns**
- Pattern: Proxy and implementation using same storage slot — `slot 0` conflict
- Pattern: Missing `__gap` in upgradeable base contracts — `uint256\[50\] private __gap` absent
- Pattern: Reordering or inserting state variables between upgrades
- Risk: Storage layout mismatch corrupts contract state after upgrade
- Remediation: Use EIP-1967 storage slots; include `__gap` arrays; never reorder state variables; use OpenZeppelin storage layout tools

**Gas Limit / Unbounded Loop DoS**
- Pattern: `for\s*\(.*\.length` iterating over dynamic array that grows via user input
- Pattern: `while\s*\(` without bounded iteration count
- Pattern: `mapping.*\[\]` iterated via loop with no upper bound
- Risk: Array grows until iteration exceeds block gas limit, bricking the function permanently
- Remediation: Use pagination patterns; cap array sizes; prefer pull over push for distributions

### Medium

**Timestamp Dependence**
- Pattern: `block\.timestamp` used in conditionals — `require\(block\.timestamp`
- Pattern: `now\s*[><=]` (deprecated alias for `block.timestamp`)
- Risk: Miners can manipulate timestamps by ~15 seconds; unreliable for precise time checks
- Remediation: Avoid timestamp for critical logic; use block numbers where possible; accept ~15s tolerance

**Floating Pragma**
- Pattern: `pragma solidity \^` or `pragma solidity >=`
- Expected: `pragma solidity 0\.8\.\d+;` (pinned, no caret)
- Risk: Contract may compile with untested compiler version containing bugs
- Remediation: Pin pragma to exact version tested — `pragma solidity 0.8.20;`

**Missing Events for State Changes**
- Pattern: State variable assignment without corresponding `emit` statement in same function
- Pattern: `onlyOwner` functions that modify state without emitting events
- Risk: Off-chain monitoring cannot detect critical state changes; poor auditability
- Remediation: Emit events for all state-changing operations, especially admin functions

**Lack of Two-Step Ownership Transfer**
- Pattern: `transferOwnership\(` that immediately changes owner in one step
- Risk: Transferring ownership to wrong address permanently locks contract
- Remediation: Use OpenZeppelin `Ownable2Step` — new owner must accept ownership

### Low

**Missing NatSpec Documentation**
- Pattern: Public/external functions without `/// @notice` or `/** @dev` comments
- Remediation: Add NatSpec for all public interfaces

**Unused Return Values**
- Pattern: `IERC20\(\w+\)\.transfer\(` without capturing or checking return value
- Remediation: Use OpenZeppelin `SafeERC20` — `safeTransfer` reverts on failure

---

## Smart Contract Security — Rust / Solana

### Critical

**Missing Signer Verification**
- Pattern (Anchor): Account struct missing `#[account(signer)]` or `Signer<'info>` type
- Pattern (Native): Missing `AccountInfo::is_signer` check — no `if !account.is_signer`
- Risk: Anyone can invoke privileged instructions without signing
- Remediation: Always verify signer — use `Signer<'info>` in Anchor; check `is_signer` in native programs

**Missing Account Owner Validation**
- Pattern (Anchor): Account struct missing `#[account(owner = expected_program)]`
- Pattern (Native): Missing `account.owner == expected_program_id` check
- Pattern: Deserialization without verifying the account is owned by the expected program
- Risk: Attacker passes forged account data owned by a different program
- Remediation: Use Anchor `#[account(owner = ...)]` constraint; verify `AccountInfo.owner` in native programs

**Arbitrary CPI (Cross-Program Invocation)**
- Pattern: `invoke\(` or `invoke_signed\(` where program ID comes from user input
- Pattern: CPI target not validated — `program_id` from `AccountInfo` without `key` check
- Risk: Attacker redirects CPI to malicious program, executing arbitrary logic with program's authority
- Remediation: Hardcode expected program IDs; validate CPI target against known program addresses

### High

**PDA Seed Collision**
- Pattern: `Pubkey::find_program_address\(` with insufficient or predictable seeds
- Pattern: PDA derived with only user-controlled seeds, no program-specific discriminator
- Risk: Attacker crafts matching PDA to access or overwrite another user's account data
- Remediation: Include unique discriminators in PDA seeds; use Anchor account discriminators; combine user pubkey + unique ID

**Missing Rent Exemption Check**
- Pattern (Native): Account creation without verifying `Rent::is_exempt`
- Pattern: `system_instruction::create_account` with insufficient lamports for rent exemption
- Risk: Account garbage collected by runtime, losing stored data
- Remediation: Always fund accounts above rent-exempt minimum; use `Rent::get()?.minimum_balance(data_len)`

**Integer Overflow in Anchor Programs**
- Pattern: Arithmetic operations without `checked_add|checked_sub|checked_mul|checked_div`
- Pattern: `as u64` or `as u128` casts that may truncate
- Risk: Wrapping arithmetic corrupts token balances or accounting logic
- Remediation: Use checked arithmetic (`checked_add`, `checked_sub`); enable `overflow-checks = true` in Cargo.toml

---

## dApp Frontend Security

### Critical

**Private Key in Frontend Code**
- Pattern (JS/TS): `(private[_-]?key|secret[_-]?key|mnemonic|seed[_-]?phrase)\s*[:=]\s*['"]`
- Pattern: `new Wallet\(['"][0-9a-fA-F]{64}['"]\)` — hardcoded private key in ethers.js
- Pattern: `Keypair\.fromSecretKey\(` with inline byte array
- Risk: Anyone viewing page source or bundle can steal all funds in the wallet
- Remediation: NEVER include private keys in frontend; use wallet extensions (MetaMask) for signing; move signing to backend

**Exposed RPC Endpoints with Write Access**
- Pattern: `eth_sendTransaction|eth_sign|eth_sendRawTransaction` accessible on public-facing RPC
- Pattern: Infura/Alchemy project ID in frontend without restricted API key
- Risk: Attacker uses exposed RPC to submit unauthorized transactions from connected wallet
- Remediation: Use read-only RPC on frontend; restrict API keys by domain and method; proxy write calls through backend

### High

**Missing Wallet Chain Verification**
- Pattern: `ethereum\.request\(\{method:\s*['"]eth_requestAccounts` without `wallet_switchEthereumChain`
- Pattern: No `chainChanged` event listener — missing `ethereum\.on\(['"]chainChanged`
- Risk: User interacts with contract on wrong network; funds sent to wrong chain
- Remediation: Verify `chainId` after connection; listen for `chainChanged` events; prompt network switch

**Transaction Data Manipulation Before Signing**
- Pattern: Building transaction parameters in frontend without server-side verification
- Pattern: Contract call parameters constructed entirely from client-side state
- Risk: User or attacker modifies transaction data in browser devtools before signing
- Remediation: Verify transaction parameters on backend; use EIP-712 typed data for structured signatures; validate server-side

**Missing EIP-712 Typed Data Signing**
- Pattern: `personal_sign` or `eth_sign` used for structured data instead of `eth_signTypedData_v4`
- Pattern: `signMessage\(` used where `_signTypedData\(` or `signTypedData\(` should be used
- Risk: Users sign opaque messages that could be valid transactions; phishing via misleading hex data
- Remediation: Use EIP-712 typed structured data signing — shows human-readable data in wallet prompt

**Missing Contract Address Verification**
- Pattern: Contract address loaded from localStorage, URL params, or unverified API
- Pattern: No checksum validation on contract addresses — `0x[a-f0-9]{40}` without EIP-55
- Risk: Users interact with malicious contract impersonating the real one
- Remediation: Hardcode verified contract addresses in build; use ENS with DNSSEC; verify checksums

### Medium

**Phishing via Fake Wallet Connect**
- Pattern: Custom wallet connection modal without using official SDK (WalletConnect, RainbowKit)
- Pattern: `window\.ethereum\.request` without verifying `window.ethereum.isMetaMask` or provider identity
- Risk: Fake wallet prompts steal private keys or trick users into signing malicious transactions
- Remediation: Use official wallet libraries (wagmi, RainbowKit, WalletConnect); verify provider identity

**Frontend Served Over HTTP**
- Pattern: `http://` in dApp URLs or API calls — not `https://`
- Pattern: Missing HSTS headers on dApp hosting
- Risk: Man-in-the-middle injects malicious contract addresses or JavaScript
- Remediation: Enforce HTTPS everywhere; set HSTS headers; consider IPFS hosting for decentralization

**Hardcoded RPC URLs to Public Endpoints**
- Pattern: `https://mainnet\.infura\.io/v3/[a-f0-9]{32}` or `https://eth-mainnet\.g\.alchemy\.com/v2/` in frontend
- Pattern: `JsonRpcProvider\(['"]https://` with public gateway URLs
- Risk: Rate limiting causes outages; leaked API keys abused; single point of failure
- Remediation: Use environment variables for RPC URLs; set up RPC fallback providers; use `FallbackProvider` in ethers.js

---

## Backend / API for Web3

### Critical

**Private Keys Without Encryption**
- Pattern: `PRIVATE_KEY=0x[a-fA-F0-9]{64}` in `.env` files or environment variables
- Pattern: `(private[_-]?key|secret[_-]?key)\s*[:=]\s*['"]0x[a-fA-F0-9]{64}['"]` in config files
- Risk: Compromised server or leaked env file gives full wallet control
- Remediation: Use KMS (AWS KMS, HashiCorp Vault) for key management; use HSMs for high-value wallets; never store raw keys

**Admin Functions Without Multisig**
- Pattern: Single EOA (Externally Owned Account) as contract owner
- Pattern: `onlyOwner` functions callable by a single private key on the server
- Risk: Single key compromise allows attacker to drain funds, upgrade contracts, or freeze protocol
- Remediation: Use Gnosis Safe multisig for all admin operations; require 2-of-3 or 3-of-5 approval; use timelock

### High

**Missing Nonce Management**
- Pattern: `getTransactionCount\(` without nonce tracking or queue
- Pattern: Concurrent transaction submissions without nonce serialization
- Risk: Transaction replay, stuck transactions, or nonce gaps causing failed transactions
- Remediation: Implement nonce manager — track local nonce, handle gaps, retry with bumped gas

**Hot Wallet with Excessive Funds**
- Pattern: Hot wallet balance exceeding operational needs (no sweep to cold storage)
- Pattern: No automated balance threshold alerts
- Risk: Compromised hot wallet key results in catastrophic loss
- Remediation: Keep minimal funds in hot wallet; automate sweep to cold storage; set balance alerts

**Missing Withdrawal Limits**
- Pattern: Transfer or withdrawal functions without per-transaction or daily limits
- Pattern: No cooldown period between large withdrawals
- Risk: Compromised key drains entire treasury in a single transaction
- Remediation: Implement per-tx and daily withdrawal limits; add timelock for large withdrawals; require multisig above threshold

**Missing Suspicious Transaction Monitoring**
- Pattern: No logging of transaction hashes, amounts, or recipients
- Pattern: No alerting on unusual withdrawal patterns or large transfers
- Risk: Exploits go undetected for hours or days, maximizing attacker profit
- Remediation: Log all transactions; alert on anomalous patterns; integrate with monitoring services (Forta, OpenZeppelin Defender)

### Medium

**Webhook Without Verification**
- Pattern: Blockchain node/indexer webhook endpoint without signature verification
- Pattern: Alchemy/Infura webhook handler missing `X-Alchemy-Signature` validation
- Risk: Attacker sends fake blockchain events, triggering unauthorized actions
- Remediation: Verify webhook signatures; validate event data against on-chain state; use HMAC verification

**Missing Signature Verification on Backend**
- Pattern: API endpoints accepting wallet address from request body without signature proof
- Pattern: `req\.body\.address` or `req\.body\.wallet` used for authorization without `ecrecover` / `verifyMessage`
- Risk: Anyone can impersonate any wallet address by simply passing it in the request
- Remediation: Require signed message (nonce-based) for authentication; verify with `ecrecover` or ethers `verifyMessage`

---

## Development & Deployment (Hardhat / Foundry)

### Critical

**Private Keys in Config Files**
- Pattern: `accounts:\s*\[['"]0x[a-fA-F0-9]{64}` in `hardhat.config.js` or `hardhat.config.ts`
- Pattern: `private_key\s*=\s*0x[a-fA-F0-9]{64}` in `foundry.toml`
- Pattern: Deployment scripts with inline private keys
- Risk: Config files committed to version control expose production wallet keys
- Remediation: Use `process.env.PRIVATE_KEY` with `.env` in `.gitignore`; use `--ledger` or `--trezor` flags for deployment

**Default Hardhat Accounts Used for Deployment**
- Pattern: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` (Hardhat account #0 private key)
- Pattern: Deployment to mainnet/testnet using accounts from `npx hardhat accounts`
- Risk: Default accounts are publicly known — deployed contracts are immediately compromised
- Remediation: Generate fresh keys for deployment; use hardware wallets; verify deployer address before mainnet deploy

**Test Private Keys in Production Config**
- Pattern: Same private key in both `networks.hardhat` and `networks.mainnet` config
- Pattern: `.env` containing well-known test keys — `0xac0974bec|0x59c6995e|0x5de4111a`
- Risk: Accidentally deploying with test keys gives anyone full control of production contracts
- Remediation: Use separate `.env.production` and `.env.development`; validate key is not well-known before mainnet deploy

### High

**Missing Contract Verification**
- Pattern: `npx hardhat deploy` or `forge create` without subsequent `verify` command
- Pattern: No `etherscan` config in `hardhat.config.js` — missing `etherscan: { apiKey: }`
- Risk: Unverified contracts erode user trust; impossible to audit on-chain; may hide malicious logic
- Remediation: Always verify on Etherscan/Sourcify after deployment; automate with `hardhat-etherscan` plugin or `forge verify-contract`

**Unlocked Accounts in Production Node**
- Pattern: `--unlock` flag in production Geth/node startup command
- Pattern: `personal.unlockAccount` in production scripts
- Risk: Unlocked account on network-accessible node allows anyone to send transactions
- Remediation: Never unlock accounts on production nodes; use transaction signing via separate signer service

### Medium

**Missing Deployment Verification Script**
- Pattern: No post-deployment checks — ownership, initial state, access control not validated
- Risk: Misconfigured deployment goes live with wrong owner, paused state, or missing roles
- Remediation: Write deployment verification scripts; check owner address, role assignments, and initial parameters after deploy

### Low

**Missing Test Coverage for Edge Cases**
- Pattern: No fuzzing in Foundry (`forge test` without `function testFuzz_`)
- Pattern: No invariant tests for DeFi protocols
- Remediation: Add fuzz tests for arithmetic functions; write invariant tests for protocol properties; aim for 100% branch coverage on critical paths
