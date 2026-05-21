<script lang="ts">
  import type { DocumentModel } from '../types/layout';

  let { model, showTOC }: { model: DocumentModel; showTOC: boolean } = $props();
</script>

<article class="dashboard-layout markdown-body" data-layout="dashboard" data-toc-visible={showTOC}>
  {@html model.contentHtml}
</article>
