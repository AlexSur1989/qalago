# QalaGo Cookie файлдары мен аналитиканы пайдалану саясаты

**RU title:** Политика использования Cookie и аналитики QalaGo
**KK title:** QalaGo Cookie файлдары мен аналитиканы пайдалану саясаты
**Нұсқа:** 2026-10-03-draft-1
**Күшіне ену күні:** NOT YET EFFECTIVE
**Мәртебе:** DRAFT — LEGAL REVIEW REQUIRED
**Соңғы жаңарту:** 2026-10-03

**Оператор:** [OPERATOR_LEGAL_NAME], [PRIVACY_EMAIL]

---

## 1. Аясы

Consumer Web cookie және жарнама/аналитика оқиғалары. **Cookie banner өнімде жоқ** — келісім талабы **LEGAL REVIEW REQUIRED**.

## 2. `qalago_web_session` cookie

| Параметр | Мән |
|----------|-----|
| Атауы | `qalago_web_session` |
| Мақсаты | браузер сессия ID — жарнама/аналитика корреляциясы |
| Формат | 32 hex |
| Мерзім | **30 күн** дейін |
| Аккаунт | тіркелген пайдаланушыны білдірмейді |
| Орнату | Consumer Web middleware |

## 3. Аналитика

AD_IMPRESSION, AD_CLICK және т.б.; `AnalyticsEvent`-те userId жоқ (ағымдағы модель). GA/Yandex **қосылмаған**. Қосылса — саясат жаңартылады.

## 4. Міндетті / опционал

Сессия cookie классifikatsiyasi — **LEGAL REVIEW REQUIRED**.

## 5. Басқару

Браузерden cookie жою — сессия нөлденуі.

## 6. Оқиғаларды сақтау

[privacy-policy.kk.md](privacy-policy.kk.md) — мерзім **LEGAL REVIEW REQUIRED**.

## 7. Өзгерістер

[WEBSITE]/cookies (бет әзірге жоқ, 6.15L.2).
