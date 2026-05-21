<script lang="ts">
  import type { DocumentModel } from '../types/layout';

  let { model, showTOC }: { model: DocumentModel; showTOC: boolean } = $props();
</script>

<article class="story-layout markdown-body" data-layout="story" data-toc-visible={showTOC}>
  {@html model.contentHtml}
</article>
