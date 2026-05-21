<script lang="ts">
  import type { DocumentModel } from '../types/layout';

  let { model, showTOC }: { model: DocumentModel; showTOC: boolean } = $props();
</script>

<article class="magazine-layout markdown-body" data-layout="magazine" data-toc-visible={showTOC}>
  {@html model.contentHtml}
</article>
