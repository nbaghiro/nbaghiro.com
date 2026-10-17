title: What an agent is allowed to change
date: 2026-10-17
about: AI systems
category: Industry & practice
cover: /img/posts/what-an-agent-can-change-wide.webp
card: /img/posts/what-an-agent-can-change-card.webp
summary: An agent’s permissions determine the consequences of its actions. Reading, drafting and sending deserve distinct boundaries.

An AI assistant that reads email and one that sends email need different permissions, even if both use the same model.

Reading an incoming message also exposes the assistant to content written by someone else. That content can contain instructions intended to redirect it. A trusted connector does not make every message it retrieves trustworthy.

## Separating permissions

[Anthropic makes this distinction](https://www.anthropic.com/engineering/how-we-contain-claude) in its explanation of agent containment: model defenses, the execution environment and access to external content all need attention. Limiting tool permissions can reduce what a successful attack is able to do.

For an email assistant, a useful design is to separate finding messages, preparing a draft and sending it. Sending can have its own authorization and a review of the actual recipients and content.

This still leaves questions about what the assistant can read and where it can send data. But it gives a team concrete boundaries to review before enabling broad access to an account.

## Review the action itself

A review step is most useful when it shows what is about to happen. For an email, that means recipients, attachments and content. A vague confirmation that the assistant may continue gives the user less information about the consequence they are authorizing.

Separating these actions also makes it possible to grant only the access needed for the task. An assistant preparing a draft may not need the ability to send it. The system can keep that ability unavailable until it is required and authorized.

## Access still needs limits

Read access can expose sensitive information, even when the agent cannot modify the source. A design review should therefore consider both the information it can retrieve and the destinations it can send information to.

These boundaries do not make a model immune to misleading instructions. They help control the consequences when it makes a mistake. Evaluating an agent’s usefulness and deciding what access to grant it are related decisions, but they need their own evidence.
