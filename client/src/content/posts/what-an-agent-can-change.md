title: What an agent is allowed to change
date: 2026-09-15
about: AI systems
category: Industry & practice
cover: /img/posts/what-an-agent-can-change-wide.webp
card: /img/posts/what-an-agent-can-change-card.webp
summary: An agent’s permissions determine the consequences of its actions. Reading, drafting and sending deserve distinct boundaries.

An agent that can read email and draft a reply has different responsibilities from one that can send it. Sending changes something outside the conversation. The recipient, wording and attachments become part of what the system must get right.

I find it useful to start with those consequences when deciding what an agent should be allowed to do. A broad instruction such as helping with email leaves too much unspecified. Finding a message, preparing a response and sending it are separate actions, and they do not need the same permissions.

## Separating information from instructions

Suppose someone asks an agent to find the latest delivery estimate in a supplier's email and draft a reply. The message contains information needed for that task. It might also contain text telling the agent to forward other messages or upload an attachment elsewhere.

The system needs to preserve the difference between the user's request and instructions found inside material it retrieves. A connection to a legitimate mailbox does not make every message in that mailbox a trusted instruction. Anthropic describes this distinction in its account of [containing agents across its products](https://www.anthropic.com/engineering/how-we-contain-claude): external content remains a potential source of prompt injection even when it arrives through an authorized integration.

For the supplier task, reading the relevant message and producing a draft would be enough. Giving the agent permission to send mail to anyone adds consequences that the task does not require.

## Making permissions match the task

A practical design would give the agent a narrow set of operations. It could search the relevant messages, retrieve the selected thread and save a draft. The application would enforce those limits when a tool is called. A sentence in the prompt asking the model to behave carefully would be additional guidance, rather than the permission boundary itself.

The same principle applies inside an operation. A tool that accepts any mailbox, recipient or file path may be much broader than its name suggests. Restricting an operation to the current account and the selected conversation can make the available action match what the user actually requested.

Read access also deserves attention. An agent can disclose information by including it in an outgoing message or sending it to another service. Limiting which information it can retrieve and where it can send data addresses different parts of that problem. Removing a delete tool alone would leave both untouched.

## Reviewing the action that will happen

If the user decides to send the draft, the review should show the actual recipients, message and attachments. An approval that says only “send the reply” gives the person little basis for checking it.

The approved content should also be the content that gets sent. If the agent changes a recipient or adds an attachment afterward, that is a different action and needs another decision. This is an application design requirement: keep the reviewed payload attached to the authorization, rather than treating approval as a general permission for whatever happens next.

Not every action needs an interruption. Saving a draft is usually easy to inspect and undo. Sending a message to a new recipient has different consequences. Choosing where review belongs requires understanding the task well enough to distinguish them.

## Keeping a useful record

After an action, the application should retain enough information to explain what happened: which account was used, what operation ran, which record or recipient it affected and what the external service reported. Recording the model's explanation alone would leave those questions unanswered.

That record also helps when an action fails partway through. A person needs to know whether a draft was saved, a message was sent or the result is still uncertain before deciding what to do next.

These boundaries do not make an agent immune to misleading content. They make its authority more specific and its actions easier to review. For the email task, that means a request to prepare a reply can stay a request to prepare a reply until the user chooses to send it.
