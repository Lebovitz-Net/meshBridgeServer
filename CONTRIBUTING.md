# 🤝 Contributing to KD1MU Mesh Dashboard

We welcome contributions that improve clarity, modularity, and protocol fidelity. Whether you're fixing a bug, adding a new handler, or improving onboarding docs, your input helps make this system more resilient and teachable.

## 🧠 Philosophy

This project is built for maintainability and onboarding ease. Please annotate your code, follow folder conventions, and keep diagnostic overlays modular.

## 🛠️ How to Contribute

1. **Fork the repo**
2. **Clone your fork**

   ```bash
   git clone https://github.com/your-username/meshmanager.git
   ```

3. **Create a branch**

   ```bash
   git checkout -b feature/my-new-handler
   ```

4. **Make your changes**
   - Add new handlers to `bridge/handlers/`
   - Use `ingestionRouter.js` for packet dispatch
   - Store user info in `db/insertUserInfo.js`
   - Store metrics in `db/insertMetrics.js`

5. **Commit and push**

   ```bash
   git commit -m "Add new handler for XYZ protocol"
   git push origin feature/my-new-handler
   ```

6. **Open a pull request**

## 📚 Style Guide

- Use consistent naming (`getNodeInfo.js`, `insertMetrics.js`)
- Annotate modules for onboarding clarity
- Keep packet decoding transport-agnostic
- Separate `user_info` and `metrics` cleanly

## 🧪 Testing

- Dry-run packet types using `packetDecoder.js`
- Validate schema with `core/schema.js`
- Emit UI refresh via `websocketEmitter.js`

---

````markdown
# 🌐 Code of Conduct

## Our Commitment

We are committed to creating a welcoming and inclusive environment for all contributors. Whether you're submitting code, reporting bugs, or suggesting improvements, we expect respectful and constructive interactions.

## Expected Behavior

- Be respectful and inclusive
- Use clear, teachable language
- Provide context when reporting issues
- Collaborate with empathy and patience

## Unacceptable Behavior

- Harassment, discrimination, or personal attacks
- Dismissive or hostile responses to questions
- Sharing offensive or inappropriate content

## Reporting Issues

If you experience or witness behavior that violates this Code of Conduct, please contact the project maintainer directly.

## Enforcement

Violations may result in warnings, removal from discussions, or banning from future contributions, depending on severity.
