<template>
  <footer class="app-footer">
    <div class="container footer-content">
      <div class="footer-links">
        <a
          href="https://github.com/gheorghiuradu/versesurf-editor"
          target="_blank"
          rel="noopener noreferrer"
          >GitHub Repo</a
        >
        <span class="separator">•</span>
        <a href="https://playversesurf.com" target="_blank" rel="noopener noreferrer">Verse Surf</a>
        <span class="separator">•</span>
        <a
          href="https://store.steampowered.com/app/1315390/Verse_Surf/"
          target="_blank"
          rel="noopener noreferrer"
          >Steam Page</a
        >
        <span class="separator">•</span>
        <a href="https://vsurf.live" target="_blank" rel="noopener noreferrer">Play Online</a>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  margin-top: auto;
  border-top: 1px solid var(--color-border);
  background: rgba(26, 16, 22, 0.5);
  padding: var(--space-lg);
  backdrop-filter: blur(8px);
}

.footer-content {
  display: flex;
  justify-content: center;
}

.footer-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-md);
  align-items: center;
}

.footer-links a {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
  transition: color var(--transition-fast);
}

.footer-links a:hover {
  color: var(--color-accent);
}

.separator {
  color: var(--color-border);
  font-size: 0.8rem;
  user-select: none;
}

@media (max-width: 600px) {
  .separator {
    display: none;
  }
  .footer-links {
    flex-direction: column;
    gap: var(--space-sm);
  }
}
</style>
