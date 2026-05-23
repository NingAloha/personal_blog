<template>
  <article>
    <h1 class="wiki-title">{{ t('notFound.title') }}</h1>
    <p>{{ t('notFound.body') }}</p>
    <p><router-link to="/">{{ t('notFound.backHome') }}</router-link></p>
  </article>
</template>

<script setup>
import { t } from '../i18n'
</script>
