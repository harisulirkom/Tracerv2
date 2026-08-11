<script setup>
defineOptions({ name: 'OrganizationTree' })

defineProps({
  members: {
    type: Array,
    default: () => [],
  },
  depth: {
    type: Number,
    default: 0,
  },
})

const phoneHref = (value) => `tel:${String(value || '').replace(/[^+\d]/g, '')}`
</script>

<template>
  <div class="organization-level" :class="{ 'organization-level--root': depth === 0 }">
    <article v-for="member in members" :key="member.id" class="organization-branch">
      <div class="organization-card">
        <div class="organization-card__accent"></div>
        <div class="flex flex-col items-center text-center">
          <img
            v-if="member.photoUrl"
            :src="member.photoUrl"
            :alt="`Foto ${member.name}`"
            class="h-20 w-20 rounded-2xl object-cover shadow-sm ring-4 ring-sky-50"
          />
          <div
            v-else
            class="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-emerald-100 text-sky-700 ring-4 ring-sky-50"
            aria-hidden="true"
          >
            <svg class="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c1.8-3.6 4.3-5.4 8-5.4S18.2 16.4 20 20" />
            </svg>
          </div>
          <p class="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700">
            {{ member.position }}
          </p>
          <h2 class="mt-2 text-lg font-semibold text-slate-900">{{ member.name }}</h2>
          <p v-if="member.bio" class="mt-3 text-sm leading-relaxed text-slate-600">{{ member.bio }}</p>
          <div v-if="member.email || member.phone" class="mt-4 flex flex-wrap justify-center gap-2 text-xs">
            <a
              v-if="member.email"
              :href="`mailto:${member.email}`"
              class="rounded-full bg-sky-50 px-3 py-1.5 font-medium text-sky-700 transition hover:bg-sky-100"
            >
              {{ member.email }}
            </a>
            <a
              v-if="member.phone"
              :href="phoneHref(member.phone)"
              class="rounded-full bg-emerald-50 px-3 py-1.5 font-medium text-emerald-700 transition hover:bg-emerald-100"
            >
              {{ member.phone }}
            </a>
          </div>
        </div>
      </div>

      <div v-if="member.children?.length" class="organization-children">
        <OrganizationTree :members="member.children" :depth="depth + 1" />
      </div>
    </article>
  </div>
</template>

<style scoped>
.organization-level {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
  gap: 1.5rem;
  align-items: start;
}

.organization-level--root {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
}

.organization-branch {
  position: relative;
  min-width: 0;
}

.organization-card {
  position: relative;
  overflow: hidden;
  border: 1px solid rgb(226 232 240);
  border-radius: 1.5rem;
  background: rgb(255 255 255 / 0.96);
  padding: 1.5rem;
  box-shadow: 0 16px 40px -28px rgb(15 23 42 / 0.4);
}

.organization-card__accent {
  position: absolute;
  inset: 0 1.5rem auto;
  height: 0.375rem;
  border-radius: 0 0 999px 999px;
  background: linear-gradient(90deg, #06b6d4, #3b82f6, #10b981);
}

.organization-children {
  position: relative;
  margin-top: 2.5rem;
}

.organization-children::before {
  content: '';
  position: absolute;
  left: 50%;
  top: -2.5rem;
  width: 1px;
  height: 2.5rem;
  background: linear-gradient(to bottom, #cbd5e1, #e2e8f0);
}

@media (min-width: 768px) {
  .organization-level--root > .organization-branch:only-child > .organization-card {
    max-width: 28rem;
    margin-inline: auto;
  }
}
</style>
