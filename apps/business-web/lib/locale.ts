export type AppLocale = 'ru' | 'kk';

export const LOCALE_COOKIE_NAME = 'qalago_locale';

export function normalizeLocale(value: string | null | undefined): AppLocale {
  if (value === 'kk' || value?.startsWith('kk')) return 'kk';
  if (value === 'ru' || value?.startsWith('ru')) return 'ru';
  return 'kk';
}

export type UiLabels = {
  text_continueWithApple: string;
  text_geoDistanceTitle: string;
  text_funnelAggregateTitle: string;
  text_settingsAuthHint2: string;
  text_settingsAuthHint1: string;
  text_planDisclaimer3: string;
  text_planDisclaimer2: string;
  text_planDisclaimer1: string;
  text_planBonus3: string;
  text_planBonus2: string;
  text_planBonus1: string;
  text_cancelAction: string;
  text_backLink: string;
  text_moderatorMessageOptional: string;
  text_afterPayment: string;
  text_packageVipCreative2: string;
  text_packageVipCreative1: string;
  text_promoForAds: string;
  text_orderAwaitingPay2: string;
  text_orderAwaitingPay1: string;
  text_orderPartialVip2: string;
  text_orderPartialVip1: string;
  checkoutMissingProductOrPackage: string;
  checkoutOrderAmountPrefix: string;
  text_checkoutCreateOrder2: string;
  text_checkoutCreateOrder1: string;
  text_checkoutManualPay3: string;
  text_checkoutManualPay2: string;
  text_checkoutManualPay1: string;
  text_loginDevNoSms: string;
  text_loginByPhone: string;
  text_supportWhatsappHours: string;
  text_hide: string;
  text_copyInviteLink: string;
  text_teamInviteHint3: string;
  text_teamInviteHint2: string;
  text_teamInviteHint1: string;
  text_revokeInvite: string;
  text_resumeAccess: string;
  text_cancel: string;
  text_savePermissions: string;
  text_revokeAccess: string;
  ownerSuspend: string;
  ownerEditPermissions: string;
  text_saveSubcategories: string;
  text_deleteGroup: string;
  text_findShort: string;
  text_setAsCover: string;
  text_mediaArchivedAfterUpgrade: string;
  text_menuShownCount: string;
  contentAuthoredTitleKkOptional: string;
  contentAuthoredDescriptionKkOptional: string;
  ownerPlanQuotaMenuLine: string;
  ownerPlanQuotaPublishedSuffix: string;
  ownerPlanQuotaMenuOverLimitLine: string;
  ownerPlanQuotaPromotionsLine: string;
  ownerPlanQuotaPhotosLine: string;
  ownerPlanQuotaPhotosOverLimitPrefix: string;
  ownerPlanPaymentHistoryTitle: string;
  ownerPlanPaymentHistoryEmpty: string;
  ownerSectionAccessDeniedTitle: string;
  ownerSectionAccessDeniedHint: string;
  ownerSectionAccessDeniedAction: string;
  ownerPlanMockPaymentTag: string;
  mediaScopeBrand: string;
  mediaScopeBranchesHeading: string;
  mediaScopePrimarySuffix: string;
  mediaScopeBranchPhotosHeading: string;
  mediaEmptyBrand: string;
  mediaEmptyBranch: string;
  mediaGallerySectionTitle: string;
  mediaScopeLoadingLocations: string;
  ownerPromotionsListHeading: string;
  serviceItemEditTitle: string;
  serviceItemEditAction: string;
  serviceItemEditSave: string;
  serviceItemEditSaved: string;
  promotionEditTitle: string;
  promotionEditAction: string;
  promotionEditSave: string;
  promotionEditSaved: string;
  branchAvailabilityHeading: string;
  branchAvailabilityModeAll: string;
  branchAvailabilityModeSelected: string;
  branchAvailabilityPrimaryBadge: string;
  branchAvailabilitySelectAtLeastOne: string;
  branchAvailabilityBranchUnavailable: string;
  branchAvailabilityNoBranches: string;
  branchAvailabilityMissingUnresolved: string;
  siteTitle: string;
  siteDescription: string;
  languageSwitcherAria: string;
  localeRu: string;
  localeKk: string;
  ____00d9ba: string;
  ____0385b6: string;
  ____03e3ed: string;
  ____055069: string;
  ____06fd2b: string;
  ____074f2d: string;
  ____091ab2: string;
  ____0b5072: string;
  ____0b7361: string;
  ____12c174: string;
  ____17fe3a: string;
  ____187ccf: string;
  ____1d1da5: string;
  ____20204b: string;
  ____2082c9: string;
  ____20b773: string;
  ____2146ba: string;
  ____2560e2: string;
  ____25686f: string;
  ____262747: string;
  ____289a51: string;
  ____28d61d: string;
  ____2cb815: string;
  ____2eeb9c: string;
  ____31cba1: string;
  ____3236ca: string;
  ____34c9f9: string;
  ____378981: string;
  ____3aa9f1: string;
  ____3dfe54: string;
  ____3f2e2a: string;
  ____3fb263: string;
  ____447674: string;
  ____4734e7: string;
  ____4c8273: string;
  ____4e15ad: string;
  ____4f4875: string;
  ____58afde: string;
  ____58f33e: string;
  ____5c9c03: string;
  ____60557b: string;
  ____606e8a: string;
  ____67d60c: string;
  ____6928ec: string;
  ____6982ec: string;
  ____6df43a: string;
  ____6e26fd: string;
  ____6e6847: string;
  ____724c24: string;
  ____734d85: string;
  ____75174f: string;
  ____7beeae: string;
  ____7c04ae: string;
  ____7c9871: string;
  ____7d54b1: string;
  ____80ffc1: string;
  ____82ba6a: string;
  ____88eb85: string;
  ____8af55c: string;
  ____8dd23a: string;
  ____8e7898: string;
  ____8f45fb: string;
  ____93b52c: string;
  ____9578ee: string;
  ____969588: string;
  ____96ae05: string;
  ____9753e3: string;
  ____998d3a: string;
  ____9c14d6: string;
  ____a2e9ce: string;
  ____a54708: string;
  ____a5f597: string;
  ____a8362b: string;
  ____a9d8c4: string;
  ____ab83e1: string;
  ____abe66e: string;
  ____ad8d65: string;
  ____aecd3d: string;
  ____b0d344: string;
  ____b1060f: string;
  ____b37257: string;
  ____bcabc8: string;
  ____bd15ac: string;
  ____bf2df1: string;
  ____c09e09: string;
  ____c0be3f: string;
  ____c1ce94: string;
  ____c8085a: string;
  ____c8191d: string;
  ____cdda15: string;
  ____ceecff: string;
  ____d078b3: string;
  ____d37b94: string;
  ____d8cfec: string;
  ____d990b1: string;
  ____db5c55: string;
  ____dd5e33: string;
  ____dd974f: string;
  ____de365b: string;
  ____e1b3c0: string;
  ____e4e179: string;
  ____e70693: string;
  ____eba489: string;
  ____ec41b7: string;
  ____fdc143: string;
  ___016439: string;
  ___088df3: string;
  ___181b32: string;
  ___208573: string;
  ___230412: string;
  ___244d38: string;
  ___2f5efd: string;
  ___31acc4: string;
  ___33efa4: string;
  ___391e3c: string;
  ___39747e: string;
  ___3de465: string;
  ___43fd9e: string;
  ___4c05a7: string;
  ___4dcc9e: string;
  ___4e6492: string;
  ___5633db: string;
  ___59bd6e: string;
  ___612420: string;
  ___61b180: string;
  ___64146f: string;
  ___68cbb0: string;
  ___6b48a6: string;
  ___6bedb6: string;
  ___6de80c: string;
  ___6e031d: string;
  ___6f7ddf: string;
  ___7097f8: string;
  ___72bac8: string;
  ___74b465: string;
  ___84d683: string;
  ___84e976: string;
  ___93a01e: string;
  ___9665e7: string;
  ___9c4728: string;
  ___9d7a93: string;
  ___a13f56: string;
  ___a2ac3e: string;
  ___a38c01: string;
  ___a6b7f9: string;
  ___b96c29: string;
  ___bad998: string;
  ___bcbf37: string;
  ___be9b89: string;
  ___c1d1fc: string;
  ___c228da: string;
  ___c312bc: string;
  ___c45ec6: string;
  ___c89390: string;
  ___cafe53: string;
  ___d0fbec: string;
  ___d9e8bc: string;
  ___dcc139: string;
  ___e1df5a: string;
  ___e99e5d: string;
  ___ee3b0e: string;
  ___email_3feee0: string;
  ___f2125d: string;
  ___f3511d: string;
  ___f80533: string;
  ___f855bd: string;
  ___f97529: string;
  ___ff1357: string;
  ___free_d25e9d: string;
  ___qalago_248e3f: string;
  ___qalago_a575a4: string;
  __00fe16: string;
  __02dfd9: string;
  __0b2e3b: string;
  __0c98ac: string;
  __0d3630: string;
  __0de733: string;
  __0fb4d5: string;
  __10dafd: string;
  __12b9df: string;
  __13dad9: string;
  __16995d: string;
  __19c279: string;
  __1c4a26: string;
  __24c04c: string;
  __2500_f917c1: string;
  __255eae: string;
  __258fc4: string;
  __259ff5: string;
  __26287a: string;
  __288711: string;
  __2a51a6: string;
  __2ab419: string;
  __2add9a: string;
  __2ca0e5: string;
  __2ea91d: string;
  __31c205: string;
  __330e3e: string;
  __343d9a: string;
  __3858f6: string;
  __399e64: string;
  __3a1b5c: string;
  __3b30e8: string;
  __3da024: string;
  __3ddda6: string;
  __3f888c: string;
  __404816: string;
  __41649d: string;
  __430244: string;
  __44e6ac: string;
  __49a9d5: string;
  __4c29c5: string;
  __4c9370: string;
  __4dc0ec: string;
  __510fe5: string;
  __542ad0: string;
  __5453e6: string;
  __55b89b: string;
  __591eff: string;
  __5a427f: string;
  __5b8b2a: string;
  __5ddc33: string;
  __5e77e4: string;
  __5f059f: string;
  __618c5e: string;
  __629993: string;
  __62b5a0: string;
  __62b685: string;
  __65f9d8: string;
  __666e84: string;
  __6a0817: string;
  __6b310c: string;
  __6b8b2e: string;
  __6be76b: string;
  __6cc61b: string;
  __7__0205a6: string;
  __7__c0883e: string;
  __7094b4: string;
  __72307b: string;
  __733f68: string;
  __74bc05: string;
  __750e6a: string;
  __77b793: string;
  __78eefe: string;
  __798c20: string;
  __79b074: string;
  __7a5b4f: string;
  __8062f8: string;
  __815828: string;
  __81f7be: string;
  __85a5da: string;
  __8c3081: string;
  __8f4ecc: string;
  __8f77f2: string;
  __9376fb: string;
  __94ed98: string;
  __997367: string;
  __99d79f: string;
  __9a1a00: string;
  __9b14e9: string;
  __9b9ea3: string;
  __9f78eb: string;
  __a0b38a: string;
  __a1281f: string;
  __a144ec: string;
  __a18ab6: string;
  __a459d5: string;
  __a4ce5c: string;
  __a4efab: string;
  __a6eca2: string;
  __a849d7: string;
  __affb23: string;
  __apple__c741a3: string;
  __audit__f2a5f6: string;
  __b05019: string;
  __b34c5f: string;
  __b43615: string;
  __b81c87: string;
  __b8c6a7: string;
  __badd65: string;
  __bb0bac: string;
  __bb49cc: string;
  __bbd5d8: string;
  __bdaf3d: string;
  __c2265b: string;
  __c2f48f: string;
  __c50655: string;
  __c50c8f: string;
  __c53959: string;
  __c6125a: string;
  __c63d55: string;
  __c660cc: string;
  __c6b09a: string;
  __c9b745: string;
  __cccdb7: string;
  __cd6c16: string;
  __cd92a5: string;
  __ce5cf6: string;
  __d6e9b9: string;
  __d80281: string;
  __d94b6a: string;
  __d9d74d: string;
  __db64ed: string;
  __dd3834: string;
  __de315a: string;
  __ded83d: string;
  __e1ba6e: string;
  __e2b6e8: string;
  __e3d304: string;
  __e747ec: string;
  __e7b2f6: string;
  __ebd04c: string;
  __ed0248: string;
  __ee11a4: string;
  __ef4a34: string;
  __email_46d244: string;
  __f50d06: string;
  __f626fa: string;
  __f71231: string;
  __f83057: string;
  __fa3ac6: string;
  __fb56a2: string;
  __fdb02d: string;
  __fe2c89: string;
  __free_3507fe: string;
  __legacy_842eec: string;
  __pro_7effee: string;
  __qalago__d094f0: string;
  __qalago_707df4: string;
  __qalago_876cc9: string;
  __sms_82ec53: string;
  __support_qalago_264d57: string;
  __vip__e0fb5c: string;
  __vip_111d64: string;
  _csv_bfd8aa: string;
  _vip___89ff3c: string;
  _vip___93dfa0: string;
  _vip___a86cb0: string;
  _vip___d83c5c: string;
  _vip__4c7126: string;
 '2____cbc60d': string; '3____592fe4': string; '4__922545': string; '5___2c16a5': string; '6___9ffbf2': string; ctr___69b910: string; email____1ae98f: string; email__ab06da: string; jpg_png__5_f0b0b6: string; legalAccountDeletionLink: string; legalDraftNotice: string; legalPrivacyLink: string; legalProductionUrlNote: string; legalTermsLink: string; legalUpdatedLabel: string; ownerMgmtMyBusiness: string; ownerMgmtPromotions: string; ownerNavAnalytics: string; ownerNavHelp: string; ownerNavMessages: string; ownerNavOverview: string; ownerNavPlan: string; ownerNavPromote: string; ownerNavSettings: string; ownerNavTeam: string; ownerPermissionCatalogEdit: string; ownerReviewReportAction: string; ownerReviewReportReasonLabel: string; ownerReviewReportReasonSpam: string; ownerReviewReportReasonInappropriate: string; ownerReviewReportReasonFalseInfo: string; ownerReviewReportReasonHarassment: string; ownerReviewReportReasonOther: string; ownerReviewReportDetailsOptional: string; ownerReviewReportSubmit: string; shellCloseNavigation: string; shellCollapseMenu: string; shellLogout: string; shellOpenNavigation: string; shellSoonBadge: string; text_014f35: string; text_047e75: string; text_065a4b: string; text_069c9c: string; text_09543f: string; text_09825a: string; text_0b4604: string; text_0d1896: string; text_125cda: string; text_1658f7: string; text_1c3fea: string; text_1c5009: string; text_1d3bf8: string; text_1ec8bd: string; text_20857d: string; text_2252aa: string; text_278bed: string; text_2928e1: string; text_2b02ca: string; text_2b0b02: string; text_2b1305: string; text_2c34bf: string; text_2d3f73: string; text_2f1160: string; text_30474d: string; text_318150: string; text_3677ee: string; text_382d73: string; text_38ca0a: string; text_3a8930: string; text_3ae691: string; text_3e177a: string; text_3f4e8c: string; text_424b69: string; text_480107: string; text_4dc45b: string; text_4e3e1b: string; text_4ec712: string; text_50df78: string; text_5427be: string; text_54a59b: string; text_54b0a7: string; text_558981: string; text_558e9d: string; text_59dca9: string; text_5a65ee: string; text_5aa92b: string; text_5e134c: string; text_602680: string; text_61dee7: string; text_63a753: string; text_63d0ff: string; text_64d5d6: string; text_66008b: string; text_67c7f6: string; text_69eca8: string; text_6a21b9: string; text_6ba3c7: string; text_6efd63: string; text_7203f7: string; text_73dba4: string; text_7407ba: string; text_74ea58: string; text_75768c: string; text_76e286: string; text_772843: string; text_786af9: string; text_79b6dc: string; text_7a1120: string; text_7aa4a8: string; text_7ae745: string; text_7d2cdd: string; text_7ed121: string; text_7f4c33: string; text_80148f: string; text_81c9da: string; text_849983: string; text_858580: string; text_85aa47: string; text_85b226: string; text_89d69a: string; text_8cdd8b: string; text_8d35fc: string; text_8d8c85: string; text_8eabdb: string; text_8f1e4c: string; text_8fc4bc: string; text_98462d: string; text_984bf1: string; text_a1ceab: string; text_a2aa4c: string; text_a46c37: string; text_aa48fa: string; text_ab6cb7: string; text_ad5122: string; text_b0e3a5: string; text_b14e2a: string; text_b5461e: string; text_b7697b: string; text_b911f5: string; text_b914bb: string; text_bc921d: string; text_becb26: string; text_bf3be1: string; text_bfc959: string; text_c25cef: string; text_c2a996: string; text_c5819f: string; text_c5ffa7: string; text_cee58b: string; text_cf59eb: string; text_d0bf2a: string; text_d24286: string; text_d2ed72: string; text_d6537c: string; text_d6d264: string; text_d71ec3: string; text_d8d7ab: string; text_d90396: string; text_d9c36c: string; text_da78ed: string; text_db5f55: string; text_dbe544: string; text_ddfaba: string; text_df0d49: string; text_df28b6: string; text_e073be: string; text_e093c1: string; text_e0fc47: string; text_e35653: string; text_e50f70: string; text_e5681e: string; text_e640a8: string; text_e76db3: string; text_e93a9b: string; text_e946df: string; text_e9c3a6: string; text_ec65a7: string; text_ed2bbf: string; text_edcf39: string; text_f0e9ac: string; text_f154d6: string; text_f1a7d3: string; text_f90bfb: string; text_f9852f: string; text_fa9392: string; text_fb3df3: string; text_ffb605: string; top__vip__239541: string; }; export const UI_LABELS: Record<AppLocale, UiLabels> = { ru: { siteTitle: 'QalaGo Business',
    siteDescription: 'Кабинет бизнеса — управление заведением в QalaGo',
    languageSwitcherAria: 'Язык интерфейса',
    localeRu: 'Русский',
    localeKk: 'Қазақша',
    ____00d9ba: 'Как ответить на отзыв?',
    ____0385b6: 'На тарифе «${planStatus?.catalog.nameRu ?? \'\'}» можно опубликовать до ${maxItems} товаров и услуг. Улучшите тариф или удалите позиции.',
    ____03e3ed: 'Найдите существующий бизнес или добавьте новый — заявка будет проверена модератором.',
    ____055069: 'Вас приглашают управлять заведением',
    ____06fd2b: 'Удаление доступно пользователям с',
    ____074f2d: 'Заполните профиль: название, адрес, описание, часы работы и минимум 3 фото. После отправки статус изменится на «На модерации» — обычно проверка занимает до 24 часов.',
    ____091ab2: 'Группы и позиции для клиентов в приложении',
    ____0b5072: 'Войти и принять приглашение',
    ____0b7361: 'Выберите параметры для расчёта.',
    ____12c174: 'Не удалось скопировать ссылку.',
    ____17fe3a: 'Отслеживайте статистику на главной',
    ____187ccf: 'Продукты недоступны для вашего заведения.',
    ____1d1da5: 'Добавьте или найдите свой бизнес',
    ____20204b: 'Добавьте или найдите бизнес, чтобы видеть статистику.',
 ____2082c9: 'Выберите типы заведения внутри категории — так пользователи быстрее найдут вас в приложении.',
    ____20b773: 'Не указан продукт или пакет',
    ____2146ba: 'Войдите, чтобы управлять заведением, командой и аналитикой.',
    ____2560e2: 'Заполните профиль заведения и загрузите фото',
    ____25686f: 'Размещение доступно на выбранный период.',
    ____262747: 'Найти товар или услугу',
    ____289a51: 'Перейти в раздел «Помощь»',
    ____28d61d: 'Не удалось войти через Google. Попробуйте ещё раз.',
    ____2cb815: 'Креатив отправлен на модерацию.',
    ____2eeb9c: 'Заявок на подтверждение пока нет.',
    ____31cba1: 'Пока нет активных кампаний',
    ____3236ca: 'Галерея карточки заведения в QalaGo',
    ____34c9f9: 'Управление спецпредложениями для клиентов',
    ____378981: 'Выберите хотя бы одно право доступа',
    ____3aa9f1: 'Достигнут лимит загрузки (${maxPhotos} фото). Улучшите тариф в разделе «Тариф».',
    ____3dfe54: 'Ссылка скопирована в буфер обмена.',
    ____3f2e2a: 'Добавить или найти бизнес',
    ____3fb263: 'Размещение недоступно на выбранные даты.',
    ____447674: 'У вас пока нет бизнеса в QalaGo',
    ____4734e7: 'Не удалось принять приглашение. Попробуйте ещё раз.',
    ____4c8273: 'Недостаточно данных для сравнения',
    ____4e15ad: 'У вас пока нет бизнеса. Подайте заявку — после модерации откроется кабинет.',
 ____4f4875: 'Сейчас оплата имитируется без списания денег. Платные тарифы активируются на 30 дней.',
 ____58afde: 'оформлен и ожидает оплаты.',
    ____58f33e: '— удаление через приложение недоступно.',
    ____5c9c03: 'Частые вопросы и контакты поддержки',
    ____60557b: 'Агрегированные корзины расстояния, без точной карты.',
    ____606e8a: 'Почему не видно акцию в приложении?',
    ____67d60c: 'Сохранить и перейти к оплате',
    ____6928ec: 'Откройте «Мой бизнес» → «Отзывы» или быстрые ссылки на обзоре, выберите отзыв и напишите ответ.',
    ____6982ec: 'Редактируйте карточку, часы работы и контакты в профиле заведения.',
    ____6df43a: 'Заявка отправлена на проверку. Доступ к кабинету появится после одобрения.',
    ____6e26fd: 'Войдите через доступный способ авторизации.',
    ____6e6847: 'Отправьте эту ссылку сотруднику. Она действует ограниченное время и одноразовая.',
    ____724c24: 'Готовые наборы рекламных размещений',
    ____734d85: 'Новые посетители — доля просмотров',
    ____75174f: 'Целевые действия по типам',
    ____7beeae: 'Профиль, контакты и часы работы',
    ____7c04ae: 'Действия по позициям каталога пока не измеряются',
    ____7c9871: 'Приглашение создано. Скопируйте ссылку и отправьте сотруднику.',
    ____7d54b1: 'Доли классифицированных просмотров, не уникальные люди.',
    ____80ffc1: 'Как пройти модерацию карточки?',
    ____82ba6a: 'Заявка будет проверена администрацией QalaGo.',
    ____88eb85: 'Показатели рассчитаны по агрегированным данным периода.',
    ____8af55c: ' — превышен лимит, новых менеджеров добавить нельзя',
    ____8dd23a: 'подтверждение, что вы — владелец аккаунта.',
    ____8e7898: 'Недостаточно данных по географии',
    ____8f45fb: 'У вас пока нет бизнеса в QalaGo.',
 ____93b52c: 'Когда пользователи начнут открывать вашу карточку в QalaGo, здесь появятся просмотры и другие метрики.',
    ____9578ee: 'Нажмите «Удалить аккаунт» и подтвердите действие дважды.',
    ____969588: 'Недостаточно данных по источникам',
    ____96ae05: 'телефон заменяется служебным значением',
    ____9753e3: 'Бесплатный — базовые лимиты и базовая статистика. Бизнес и PRO — больше фото, товаров, акций, менеджеров и расширенная аналитика. VIP — максимальные лимиты и Аналитика 360 (по мере внедрения). Подписка не повышает органический рейтинг; рекламные размещения покупаются отдельно.',
    ____998d3a: 'Поиск по названию и адресу в выбранном городе.',
    ____9c14d6: 'Например: Горячие блюда, Стрижка',
    ____a2e9ce: 'Приглашение не найдено или ссылка недействительна.',
    ____a54708: 'Недостаточно данных по поисковым запросам',
    ____a5f597: 'Рекламные размещения приобретаются отдельно.',
    ____a8362b: 'Не нашли свой бизнес?',
    ____a9d8c4: 'Заявки на добавление нового бизнеса.',
    ____ab83e1: 'Изменить тариф может только владелец',
    ____abe66e: 'Если ваш бизнес уже есть в QalaGo, запросите доступ вместо создания новой карточки.',
    ____ad8d65: 'Заявки на владение существующим бизнесом.',
    ____aecd3d: 'Бизнес будет доступен после запуска города.',
 ____b0d344: 'Вход временно недоступен: не настроен ни один способ авторизации. Обратитесь к администратору QalaGo.',
    ____b1060f: 'На текущем тарифе публикуется ограниченное число активных акций. Остальные сохранены в кабинете.',
    ____b37257: 'Что будет когда тариф закончится?',
    ____bcabc8: 'Активные и завершённые рекламные кампании',
    ____bd15ac: 'Доступно с тарифа Бизнес',
    ____bf2df1: 'Как отображать в кабинете',
    ____c09e09: 'Действия по акциям пока не измеряются',
    ____c0be3f: 'Управление командой доступно только владельцу заведения.',
    ____c1ce94: 'Добавьте меню или услуги',
    ____c8085a: 'Аккаунт и управление заведением',
    ____c8191d: 'Вход по номеру телефона · OTP (тест: +77000000002, код 1234)',
 ____cdda15: '— удаление заблокировано до передачи управления другому владельцу.',
    ____ceecff: 'Мы сообщим о результате после проверки.',
    ____d078b3: 'Пока нет уведомлений. Здесь появятся новые отзывы, статусы модерации и другие события.',
    ____d37b94: 'Заполните название, категорию, город и адрес',
    ____d8cfec: 'Менеджер добавлен в команду.',
    ____d990b1: 'После оформления заказа переведите сумму по реквизитам из этого раздела. Оплата подтверждается администратором вручную — автоматического списания нет.',
    ____db5c55: 'Перейдите в раздел «Профиль».',
    ____dd5e33: 'Как связаться с поддержкой?',
    ____dd974f: 'Как добавить товары или услуги?',
    ____de365b: 'Статистика появится после первых просмотров карточки',
    ____e1b3c0: 'В разделе «Товары и услуги» создайте группу (например, «Кофе») и добавьте позиции с ценой.',
    ____e4e179: 'Загрузите баннер и тексты для модерации',
    ____e70693: 'Акция должна быть «Активна», заведение — опубликовано. На Free/Basic число одновременно активных акций ограничено тарифом — лишние сохраняются в кабинете, но не публикуются.',
 ____eba489: 'Оформление подписки через кабинет пока недоступно. Информация о тарифе отображается для справки.',
    ____ec41b7: 'Чем отличаются тарифы Бесплатный, Бизнес, PRO и VIP?',
    ____fdc143: 'Нет просмотров позиций каталога',
    ___016439: 'Готовые наборы размещений',
    ___088df3: 'На страницу входа',
    ___181b32: 'Посетители и сессии',
    ___208573: 'Пока нет акций',
    ___230412: 'Заказов пока нет',
    ___244d38: '📷 Фото и видео',
    ___2f5efd: 'Перейти к оформлению',
    ___31acc4: 'Вернувшиеся — доля просмотров',
    ___33efa4: 'Пока нет фото',
    ___391e3c: 'изменил права сотрудника',
    ___39747e: 'Заказ не найден',
    ___3de465: 'Заказов пока нет.',
    ___43fd9e: 'Перейти к онбордингу',
    ___4c05a7: 'Пока нет событий',
    ___4dcc9e: 'Пока нет участников',
    ___4e6492: 'Далее: креатив баннера',
    ___5633db: 'Подтвердить права владельца',
    ___59bd6e: 'Что ищут пользователи',
    ___612420: 'Найти свой бизнес',
    ___61b180: 'Добавить новый бизнес',
    ___64146f: 'Единственный владелец бизнеса',
    ___68cbb0: 'Телефон не указан',
    ___6b48a6: 'Имя аккаунта сохранено',
    ___6bedb6: 'Куда ведёт клик',
    ___6de80c: 'Срок действия истёк',
    ___6e031d: 'Ответ на отзыв',
    ___6f7ddf: 'Название или адрес',
    ___7097f8: 'Только для владельца',
    ___72bac8: 'История рекламных заказов',
    ___74b465: '← Найти существующий бизнес',
    ___84d683: 'Позиции не найдены',
    ___84e976: '[ТРЕБУЕТ ПОДТВЕРЖДЕНИЯ ОПЕРАТОРА].',
    ___93a01e: 'Сначала сохраните черновик',
    ___9665e7: 'Отправить на проверку',
    ___9c4728: 'Кампания не найдена',
    ___9d7a93: 'Кампаний пока нет.',
    ___a13f56: 'Новые и вернувшиеся',
    ___a2ac3e: 'Нет активных акций',
    ___a38c01: 'Создайте первую акцию',
    ___a6b7f9: 'Конверсия в действие',
    ___b96c29: 'Желаемая дата начала',
    ___bad998: 'Вернуться в каталог',
    ___bcbf37: 'Найти существующий бизнес',
    ___be9b89: 'Пока нет отзывов',
    ___c1d1fc: 'Добавить или найти',
    ___c228da: 'Лимит фото достигнут',
    ___c312bc: 'Ближайшая доступная дата: ${formatDate(state.nextAvailableAt)}',
    ___c45ec6: 'Лимит активных акций',
    ___c89390: 'Фото и видео',
    ___cafe53: 'Заявок пока нет.',
    ___d0fbec: 'Как оплатить рекламу?',
    ___d9e8bc: 'не выполняется автоматически',
    ___dcc139: '📋 Товары и услуги',
    ___e1df5a: 'Пакет не найден',
    ___e99e5d: 'Пакеты временно недоступны.',
    ___ee3b0e: '➕ Товар или услуга',
    ___email_3feee0: 'профиль пользователя: имя, email, предпочитаемый город;',
    ___f2125d: 'Сравнение с категорией',
    ___f3511d: 'Продукт не найден',
    ___f80533: 'Укажите заголовок баннера',
    ___f855bd: 'Нет активных приглашений',
    ___f97529: 'Приглашение в команду',
    ___ff1357: 'Отправить на модерацию',
    ___free_d25e9d: 'Заведение вернётся на Free: лишние фото, товары и акции останутся в кабинете, но перестанут публиковаться сверх лимита. Уведомление придёт во «Входящие».',
    ___qalago_248e3f: 'Бонус на рекламу QalaGo',
    ___qalago_a575a4: 'Как удалить аккаунт QalaGo',
    __00fe16: 'Последние заказы',
    __02dfd9: 'Ссылка приглашения',
    __0b2e3b: 'приостановил доступ',
    __0c98ac: '✏️ Редактировать бизнес',
    __0d3630: 'Рекламные размещения',
    __0de733: 'История изменений',
    __0fb4d5: 'К оплате',
    __10dafd: 'Все кампании →',
    __12b9df: 'Покупка недоступна',
    __13dad9: 'Пакеты продвижения',
    __16995d: 'Тестовая оплата',
    __19c279: 'Рекламные кампании',
    __1c4a26: 'Мои заказы',
    __24c04c: 'Запустить рекламу',
    __2500_f917c1: 'Цена, например 2500',
    __255eae: 'Пн–Пт',
    __258fc4: 'Заявка отправлена',
    __259ff5: 'Загрузка позиций…',
    __26287a: 'Загрузить фото',
    __288711: 'Правовая информация',
    __2a51a6: 'Может сохраняться',
    __2ab419: 'Имя владельца',
    __2add9a: 'Источники просмотров',
    __2ca0e5: 'отозвал доступ',
    __2ea91d: '← К каталогу',
    __31c205: 'Заголовок баннера',
    __330e3e: 'Создание заказа…',
    __343d9a: 'Принять приглашение',
    __3858f6: 'Подключить (тест)',
    __399e64: 'Открыть кабинет',
    __3a1b5c: 'Просмотры акций:',
    __3b30e8: 'Добавить бизнес',
    __3da024: 'Мои заявки',
    __3ddda6: 'На главную',
    __3f888c: 'Заявка отменена',
    __404816: 'Новая акция',
    __41649d: '← К списку',
    __430244: 'Добавить позицию',
    __44e6ac: 'Добавить группу',
    __49a9d5: 'Создать заказ',
    __4c29c5: 'Текущий тариф',
    __4c9370: 'Базовая цена',
    __4dc0ec: 'Заказ создан',
    __510fe5: 'не предусмотрена',
    __542ad0: 'Изображение баннера',
    __5453e6: 'Отменить заявку',
    __55b89b: 'Купить размещение',
    __591eff: '📣 Запустить рекламу',
    __5a427f: 'Расчёт стоимости',
    __5b8b2a: 'Обновить ответ',
    __5ddc33: 'Целевые действия',
    __5e77e4: 'График работы',
    __5f059f: '← К пакетам',
    __618c5e: 'Подтверждение прав',
    __629993: 'Пакет продвижения',
    __62b5a0: 'Подтвердить права',
    __62b685: 'Краткое описание',
    __65f9d8: '← На главную',
    __666e84: 'Приглашение отозвано',
    __6a0817: 'Скидка тарифа',
    __6b310c: 'после одобрения',
    __6b8b2e: 'Недавние действия',
    __6be76b: 'Нет доступа',
    __6cc61b: 'Права доступа',
    __7__0205a6: 'Действия за 7 дней',
    __7__c0883e: 'Просмотры за 7 дней',
    __7094b4: 'Отправить заявку',
    __72307b: 'Все заказы →',
    __733f68: 'Статус кампании',
    __74bc05: 'Отправить код',
    __750e6a: ' · ${unanswered} без ответа',
    __77b793: 'Текст кнопки',
    __78eefe: 'Использование тарифа',
    __798c20: 'Загрузка пакетов…',
    __79b074: 'Подробная статистика →',
    __7a5b4f: 'Активные акции',
    __8062f8: 'Создать акцию',
    __815828: 'Черновик сохранён',
    __81f7be: 'восстановил доступ',
    __85a5da: 'Загрузка расчёта…',
    __8c3081: 'Поисковые запросы',
    __8f4ecc: 'Без группы',
    __8f77f2: 'принял приглашение',
    __9376fb: 'Ожидает принятия',
    __94ed98: 'Мои бизнесы',
    __997367: 'Ответ владельца',
    __99d79f: 'Приглашение недоступно.',
    __9a1a00: 'Новый заказ',
    __9b14e9: 'Подкатегории сохранены',
    __9b9ea3: 'Новое размещение',
    __9f78eb: 'Ваш ответ:',
    __a0b38a: 'Запрошенный старт',
    __a1281f: 'Новая позиция',
    __a144ec: 'Быстрые ссылки',
    __a18ab6: 'Состав заказа',
    __a459d5: 'Профиль заведения',
    __a4ce5c: '🏷️ Создать акцию',
    __a4efab: 'Товар / услуга',
    __a6eca2: 'Администраторы платформы',
    __a849d7: 'Карточка заведения',
    __affb23: 'Юридические документы',
    __apple__c741a3: 'Отзыв авторизации Apple на стороне Apple',
    __audit__f2a5f6: 'заказы, платежи, audit-логи — основания хранения [ТРЕБУЕТ ПОДТВЕРЖДЕНИЯ ЮРИСТА];',
    __b05019: 'Быстрые действия',
    __b34c5f: 'Политикой конфиденциальности',
    __b43615: 'Выбрать файл',
    __b81c87: 'Состав пакета',
    __b8c6a7: 'Статистика рекламы →',
    __badd65: 'Популярные часы',
    __bb0bac: 'Без текста',
    __bb49cc: 'Активные кампании',
    __bbd5d8: 'Загрузка статистики…',
    __bdaf3d: 'ваши отзывы;',
    __c2265b: 'Связанные кампании',
    __c2f48f: 'пригласил сотрудника',
    __c50655: 'Управление группами',
    __c50c8f: 'Отменить заявку?',
    __c53959: 'Загрузка каталога…',
    __c6125a: 'Активно до ${formatDate(state.activeUntil)}',
    __c63d55: 'Загрузка тарифов…',
    __c660cc: 'Детали кампании',
    __c6b09a: 'Без описания',
    __c9b745: 'Все кампании',
    __cccdb7: 'Пригласить менеджера',
    __cd6c16: 'Квалиф. показы',
    __cd92a5: 'Нет изображения',
    __ce5cf6: 'Фактический период',
    __d6e9b9: 'Продвигаемая акция',
    __d80281: 'Ожидающие приглашения',
    __d94b6a: 'Посмотреть тарифы',
    __d9d74d: 'На модерации',
    __db64ed: 'Внешняя ссылка',
    __dd3834: 'Продвинуть акцию',
    __de315a: 'Дата начала',
    __ded83d: 'Выбрать размещение',
    __e1ba6e: 'График просмотров',
    __e2b6e8: 'Сохранить черновик',
    __e3d304: 'Все акции',
    __e747ec: 'Показать ещё',
    __e7b2f6: 'Детали заказа',
    __ebd04c: 'Рекламные продукты',
    __ed0248: 'Прочитать все',
    __ee11a4: 'Загрузка приглашения…',
    __ef4a34: 'Быстрый старт',
    __email_46d244: 'По ссылке (email)',
    __f50d06: 'Оформление заказа',
    __f626fa: 'Уже принято',
    __f71231: 'Мои кампании',
    __f83057: 'Новый бизнес',
    __fa3ac6: 'Сравнение периодов',
    __fb56a2: 'Новая группа',
    __fdb02d: 'Изменения сохранены',
    __fe2c89: 'Новый отзыв',
    __free_3507fe: 'Вернуться на Free',
    __legacy_842eec: 'По телефону (legacy)',
    __pro_7effee: 'Доступно с PRO',
    __qalago__d094f0: 'Войдите в QalaGo, чтобы принять приглашение.',
    __qalago_707df4: 'Удаление аккаунта — QalaGo',
    __qalago_876cc9: 'Удаление аккаунта QalaGo',
    __sms_82ec53: 'Код из SMS',
    __support_qalago_264d57: 'Напишите на support@qalago.kz или в WhatsApp +7 777 000 00 00 (MVP — демо-контакт). Укажите название заведения и номер телефона аккаунта.',
    __vip__e0fb5c: 'Далее: креатив VIP-баннера',
    __vip_111d64: 'Доступно с VIP',
    _csv_bfd8aa: 'Экспорт CSV',
    _vip___89ff3c: 'Креатив VIP-баннера привязан к заказу и будет отправлен на модерацию после оплаты.',
    _vip___93dfa0: 'Включает VIP-баннер — потребуется креатив и модерация.',
    _vip___a86cb0: 'Период VIP-размещения начинается после одобрения баннера модератором.',
    _vip___d83c5c: 'Для VIP-баннера нужно загрузить креатив. После оформления заказа баннер отправится на модерацию.',
    _vip__4c7126: 'Креатив VIP-баннера',
    '2____cbc60d': '2. Если приложение недоступно',
    '3____592fe4': '3. Что происходит при удалении',
    '4__922545': '4. Ограничения',
    '5___2c16a5': '5. После удаления',
    '6___9ffbf2': '6. Кабинет бизнеса',
    ctr___69b910: 'CTR и воронка',
    email____1ae98f: 'email провайдера или маскированный телефон, если известны;',
    email__ab06da: 'Email менеджера',
    jpg_png__5_f0b0b6: 'JPG/PNG до 5 МБ. Первое фото можно сделать обложкой автоматически.',
    legalAccountDeletionLink: 'Удаление аккаунта',
    legalDraftNotice:
      'Черновик на основе фактического поведения приложения. Требуется проверка юриста перед публикацией в production.',
    legalPrivacyLink: 'Политика конфиденциальности',
    legalProductionUrlNote: 'Production URL: {url} (после развёртывания на qalago.kz)',
    legalTermsLink: 'Условия использования',
    legalUpdatedLabel: 'Обновлено',
    ownerMgmtMyBusiness: 'Мой бизнес',
    ownerMgmtPromotions: 'Акции',
    ownerNavAnalytics: 'Статистика',
    ownerNavHelp: 'Помощь',
    ownerNavMessages: 'Уведомления',
    ownerNavOverview: 'Обзор',
    ownerNavPlan: 'Тариф',
    ownerNavPromote: 'Реклама и продвижение',
    ownerNavSettings: 'Настройки',
    ownerNavTeam: 'Команда',
    ownerPermissionCatalogEdit: 'Товары и услуги',
    ownerReviewReportAction: 'Пожаловаться на отзыв',
    ownerReviewReportReasonLabel: 'Причина жалобы',
    ownerReviewReportReasonSpam: 'Спам',
    ownerReviewReportReasonInappropriate: 'Неподходящий контент',
    ownerReviewReportReasonFalseInfo: 'Ложная информация',
    ownerReviewReportReasonHarassment: 'Оскорбления или домогательства',
    ownerReviewReportReasonOther: 'Другое',
    ownerReviewReportDetailsOptional: 'Комментарий (необязательно)',
    ownerReviewReportSubmit: 'Отправить жалобу',
    shellCloseNavigation: 'Закрыть меню',
    shellCollapseMenu: 'Свернуть меню',
    shellLogout: 'Выйти',
    shellOpenNavigation: 'Открыть меню',
    shellSoonBadge: 'скоро',
    text_mediaArchivedAfterUpgrade: 'сохранены и снова появятся после повышения тарифа.',
    text_setAsCover: 'На обложку',
    text_findShort: 'Найти',
    text_deleteGroup: 'Удалить группу',
    text_saveSubcategories: 'Сохранить подкатегории',
    ownerEditPermissions: 'Изменить права',
    ownerSuspend: 'Приостановить',
    text_revokeAccess: 'Отозвать доступ',
    text_savePermissions: 'Сохранить права',
    text_cancel: 'Отмена',
    text_resumeAccess: 'Возобновить доступ',
    text_revokeInvite: 'Отозвать приглашение',
    text_teamInviteHint1: 'Укажите email сотрудника и выберите права. После создания скопируйте ссылку и отправьте её',
    text_teamInviteHint2: 'сотруднику (email, мессенджер и т.д.). Если пользователь уже зарегистрирован с этим email,',
    text_teamInviteHint3: 'доступ может быть выдан сразу.',
    text_copyInviteLink: 'Скопировать ссылку',
    text_hide: 'Скрыть',
    text_supportWhatsappHours: 'WhatsApp: +7 777 000 00 00 · пн–пт 10:00–19:00 (UTC+5)',
    text_loginByPhone: 'Войти по телефону',
    text_loginDevNoSms: 'Войти без SMS',
    checkoutMissingProductOrPackage: 'Не указан продукт или пакет.',
    checkoutOrderAmountPrefix: 'Заказ на сумму',
    text_checkoutManualPay1: 'Для активации размещения переведите сумму по реквизитам, указанным в разделе',
    text_checkoutManualPay2: '«Помощь», и дождитесь подтверждения оплаты администратором. Автоматического списания',
    text_checkoutManualPay3: 'нет — статус заказа обновится после ручного подтверждения.',
    text_checkoutCreateOrder1: 'Нажимая «Создать заказ», вы подтверждаете заказ. Оплата производится вручную — заказ',
    text_checkoutCreateOrder2: 'перейдёт в статус «Оплачен» только после подтверждения администратором.',
    text_orderPartialVip1: 'Пакет частично активен: размещения без VIP уже запущены или запланированы. VIP-баннер',
    text_orderPartialVip2: 'начнёт показы после одобрения креатива модератором — до этого период VIP не стартует.',
    text_orderAwaitingPay1: 'Заказ ожидает ручной оплаты. После перевода средств администратор подтвердит оплату — до',
    text_orderAwaitingPay2: 'этого кампании не активируются.',
    text_promoForAds: 'Акция для продвижения',
    text_packageVipCreative1: 'Пакет включает VIP-баннер. Сначала подготовьте креатив — период VIP-размещения',
    text_packageVipCreative2: 'начнётся после одобрения баннера. Остальные размещения пакета активируются после',
    text_afterPayment: 'оплаты.',
    text_moderatorMessageOptional: 'Сообщение для модератора (необязательно)',
    text_backLink: '← Назад',
    text_cancelAction: 'Отменить',
    text_planBonus1: 'Ежемесячный бонус — внутренний кредит для оплаты eligible рекламных продуктов QalaGo.',
    text_planBonus2: 'Это не наличные деньги, не cashback и не выводимый баланс. Начисление бонуса будет',
    text_planBonus3: 'доступно после внедрения учётной модели (Stage 6.4 — только отображение в тарифах).',
    text_planDisclaimer1: 'Подписка не повышает органический рейтинг в каталоге. Рекламные размещения',
    text_planDisclaimer2: 'приобретаются отдельно. Скидка тарифа применяется к отдельным рекламным продуктам',
    text_planDisclaimer3: 'при оформлении заказа и фиксируется в истории оплат.',
    text_settingsAuthHint1: 'Вход через Google, Apple или OTP (если включено). Удаление аккаунта потребителя —',
    text_settingsAuthHint2: 'в мобильном приложении QalaGo.',
    text_funnelAggregateTitle: 'Воронка (агрегат периода)',
    text_geoDistanceTitle: 'География (расстояние)',
    text_continueWithApple: 'Продолжить с Apple',
    text_014f35: 'Кампании',
    text_047e75: 'Активна',
    text_065a4b: 'Оформление',
    text_069c9c: 'Город',
    text_09543f: ' · ${unread} непрочитанных',
    text_09825a: 'Базовая',
    text_0b4604: 'Настроить',
    text_0d1896: 'Приглашение',
    text_125cda: 'Подкатегории',
    text_1658f7: ' (публикуется ${planStatus.entitlements.activePromotions.published})',
    text_1c3fea: 'Отзывы',
    text_1c5009: 'Бизнес',
    text_1d3bf8: 'Онбординг',
    text_1ec8bd: 'Оплачен',
    text_20857d: 'Сравнение',
    text_2252aa: 'Полная',
    text_278bed: 'Предпросмотр',
    text_2928e1: 'Телефон',
    text_2b02ca: 'Выбрать',
    text_2b0b02: 'Назад',
    text_2b1305: 'Отозвано',
    text_2c34bf: 'Параметры',
    text_2d3f73: 'Подключение…',
    text_2f1160: 'Анонимизируется',
    text_30474d: 'Размещение',
    text_318150: 'Активен',
    text_3677ee: 'Безопасность',
    text_382d73: 'Размещения',
    text_38ca0a: 'Описание',
    text_3a8930: 'навсегда',
    text_3ae691: 'уведомления;',
    text_3e177a: 'Активировать',
    text_3f4e8c: 'Позиции',
    text_424b69: 'Модерация',
    text_480107: 'Контент',
    text_4dc45b: 'Заполненность',
    text_4e3e1b: 'Заведение',
    text_4ec712: 'Пакеты',
    text_50df78: 'Общее',
    text_5427be: 'Заведение:',
    text_54a59b: 'Сохранено',
    text_54b0a7: 'Просмотры',
    text_558981: 'Заголовок *',
    text_558e9d: 'Рекомендации',
    text_59dca9: 'Детали',
    text_5a65ee: 'Акция ${row.promotionId.slice(0, 8)}…',
    text_5aa92b: 'Удаляется',
    text_5e134c: 'Пригласить',
    text_602680: 'Название',
    text_61dee7: 'Сайт',
    text_63a753: 'Войти',
    text_63d0ff: 'мес',
    text_64d5d6: 'Доля',
    text_66008b: 'Привлечение',
    text_67c7f6: 'Запрос',
    text_69eca8: 'Название *',
    text_6a21b9: 'Адрес *',
    text_6ba3c7: 'Искать',
    text_6efd63: 'Поиск…',
    text_7203f7: 'Статус',
    text_73dba4: 'Сохранение…',
    text_7407ba: 'Обложка',
    text_74ea58: 'Сохранить',
    text_75768c: 'Контакты',
    text_76e286: '← Обзор',
    text_772843: 'Текущий',
    text_786af9: 'Предыдущий',
    text_79b6dc: 'География',
    text_7a1120: 'Источник',
    text_7aa4a8: '${campaigns.length} кампаний',
    text_7ae745: 'Метрика',
    text_7d2cdd: 'Скоро',
    text_7ed121: 'или',
    text_7f4c33: 'Исправить',
    text_80148f: 'Адрес',
    text_81c9da: 'да',
    text_849983: 'Подтверждение',
    text_858580: 'Изменение',
    text_85aa47: 'Старт',
    text_85b226: 'Участники',
    text_89d69a: 'Загрузка…',
    text_8cdd8b: 'Дата',
    text_8d35fc: 'Переходов',
    text_8d8c85: 'Система',
    text_8eabdb: ' (публикуется ${planStatus.entitlements.photos.published})',
    text_8f1e4c: '🏷️ Акции',
    text_8fc4bc: 'Оплаты',
    text_98462d: 'Клики',
    text_984bf1: 'Все',
    text_a1ceab: 'Аккаунт',
    text_a2aa4c: 'Отправка…',
    text_a46c37: 'Профиль',
    text_aa48fa: 'Воскресенье',
    text_ab6cb7: 'Недоступно',
    text_ad5122: 'Каталог',
    text_b0e3a5: 'Завершить',
    text_b14e2a: 'Аудитория',
    text_b5461e: 'Формирование…',
    text_b7697b: 'Корзина',
    text_b911f5: 'Запланированные',
    text_b914bb: 'Повторить',
    text_bc921d: ' (+${planStatus.team.pendingInvitations} приглаш.)',
    text_becb26: 'Реклама',
    text_bf3be1: '${periodDays} дн.',
    text_bfc959: 'Поиск',
    text_c25cef: 'Показы',
    text_c2a996: 'Источники',
    text_c5819f: 'избранное;',
    text_c5ffa7: 'Продукт',
    text_cee58b: 'Суббота',
    text_cf59eb: 'Сумма',
    text_d0bf2a: 'Город *',
    text_d24286: ' · скрыта',
    text_d2ed72: 'Уведомления',
    text_d6537c: ' (публикуется ${planStatus.entitlements.serviceItems.published})',
    text_d6d264: 'Номер',
    text_d71ec3: 'Категория *',
    text_d8d7ab: '${plan.limits.monthlyAdBonusKzt.toLocaleString(\'ru-RU\')} ₸/мес',
    text_d90396: 'Скидка',
    text_d9c36c: 'Продукты',
    text_da78ed: 'Кабинет',
    text_db5f55: 'Подробнее',
    text_dbe544: 'Обновить',
    text_ddfaba: 'Принимаем…',
    text_df0d49: 'Акция',
    text_df28b6: 'нет',
    text_e073be: 'Динамика',
    text_e093c1: 'Владелец',
    text_e0fc47: 'заведения',
    text_e35653: 'Креатив',
    text_e50f70: '${formatChartDate(p.date)}: ${p.v} просмотров',
    text_e5681e: 'Ответить',
    text_e640a8: 'Уральск',
    text_e76db3: '⭐ Отзывы',
    text_e93a9b: 'Запрошено: ${formatDateTime(c.requestedStartAt)}',
    text_e946df: 'Открыть',
    text_e9c3a6: 'Продолжить',
    text_ec65a7: 'Разделы',
    text_ed2bbf: 'Удалить',
    text_edcf39: 'Итого',
    text_menuShownCount: 'Показано ${shown} из ${total}',
    contentAuthoredTitleKkOptional: 'Название на казахском (необязательно)',
    contentAuthoredDescriptionKkOptional: 'Описание на казахском (необязательно)',
    ownerPlanQuotaMenuLine:
      'Тариф «${planName}»: ${used} / ${max} товаров и услуг',
    ownerPlanQuotaPublishedSuffix: ' · опубликовано ${count}',
    ownerPlanQuotaMenuOverLimitLine:
      'На текущем тарифе публикуется до ${max} позиций. Остальные сохранены в кабинете.',
    ownerPlanQuotaPromotionsLine:
      'Тариф «${planName}»: активных ${active} / ${max} · срок акции до ${days} дн.',
    ownerPlanQuotaPhotosLine: 'Тариф «${planName}»: ${used} / ${max} фото',
    ownerPlanPaymentHistoryTitle: 'История оплат тарифа',
    ownerPlanPaymentHistoryEmpty: 'Платежей пока нет.',
    ownerSectionAccessDeniedTitle: 'Нет доступа к этому разделу.',
    ownerSectionAccessDeniedHint: 'У вашей роли нет необходимых прав.',
    ownerSectionAccessDeniedAction: 'Вернуться в обзор',
    ownerPlanMockPaymentTag: 'тест',
    ownerPlanQuotaPhotosOverLimitPrefix:
      'На тарифе «${planName}» публикуется до ${max} фото. Остальные',
    mediaScopeBrand: 'Общие фото',
    mediaScopeBranchesHeading: 'Филиалы',
    mediaScopePrimarySuffix: 'основной',
    mediaScopeBranchPhotosHeading: 'Фото филиала',
    mediaEmptyBrand:
      'Общие фото видны во всём бизнесе и дополняют галерею каждого филиала. Загрузите первое изображение.',
    mediaEmptyBranch:
      'Фото здесь показываются только для выбранного филиала (перед общими фото). Загрузите первое изображение.',
    mediaGallerySectionTitle: 'Галерея (${count})',
    mediaScopeLoadingLocations: 'Загрузка филиалов…',
    ownerPromotionsListHeading: 'Список (${count})',
    serviceItemEditTitle: 'Редактирование позиции',
    serviceItemEditAction: 'Изменить',
    serviceItemEditSave: 'Сохранить',
    serviceItemEditSaved: 'Позиция сохранена',
    promotionEditTitle: 'Редактирование акции',
    promotionEditAction: 'Изменить',
    promotionEditSave: 'Сохранить',
    promotionEditSaved: 'Акция сохранена',
    branchAvailabilityHeading: 'Доступность по филиалам',
    branchAvailabilityModeAll: 'Во всех филиалах',
    branchAvailabilityModeSelected: 'В выбранных филиалах',
    branchAvailabilityPrimaryBadge: 'Основной филиал',
    branchAvailabilitySelectAtLeastOne: 'Выберите хотя бы один филиал',
    branchAvailabilityBranchUnavailable: 'Филиал недоступен — обновите выбор или верните «Во всех филиалах»',
    branchAvailabilityNoBranches:
      'Нет филиалов для выбора. Добавьте адрес в разделе «Филиалы» или оставьте «Во всех филиалах».',
    branchAvailabilityMissingUnresolved:
      'Сохранение заблокировано: часть ранее выбранных филиалов недоступна. Измените режим или обновите список филиалов.',
    text_f0e9ac: ' · страница ${pagination.page} / ${pagination.totalPages}',
    text_f154d6: 'Пользователь',
    text_f1a7d3: 'Расширенная',
    text_f90bfb: 'Период',
    text_f9852f: 'Кампания',
    text_fa9392: 'Состав',
    text_fb3df3: 'Действия',
    text_ffb605: 'Длительность',
    top__vip__239541: 'TOP, буст, VIP-баннер и др.',
  },
  kk: {
    siteTitle: 'QalaGo Business',
    siteDescription: 'Бизнес кабинеті — QalaGo-да мекемені басқару',
    languageSwitcherAria: 'Интерфейс тілі',
    localeRu: 'Русский',
    localeKk: 'Қазақша',
    ____00d9ba: 'Как ответить на отзыв?',
    ____0385b6: 'На тарифе «${planStatus?.catalog.nameRu ?? \'\'}» можно опубликовать до ${maxItems} товаров и услуг. Улучшите тариф или удалите позиции.',
    ____03e3ed: 'Найдите существующий бизнес или добавьте новый — заявка будет проверена модератором.',
    ____055069: 'Вас приглашают управлять заведением',
    ____06fd2b: 'Удаление доступно пользователям с',
    ____074f2d: 'Заполните профиль: название, адрес, описание, часы работы и минимум 3 фото. После отправки статус изменится на «Модерацияда» — обычно проверка занимает до 24 часов.',
    ____091ab2: 'Группы и позиции для клиентов в приложении',
    ____0b5072: 'Войти и принять приглашение',
    ____0b7361: 'Выберите параметры для расчёта.',
    ____12c174: 'Не удалось скопировать ссылку.',
    ____17fe3a: 'Отслеживайте статистику на главной',
    ____187ccf: 'Продукты недоступны для вашего заведения.',
    ____1d1da5: 'Добавьте или найдите свой бизнес',
    ____20204b: 'Добавьте или найдите бизнес, чтобы видеть статистику.',
 ____2082c9: 'Выберите типы заведения внутри категории — так пользователи быстрее найдут вас в приложении.',
    ____20b773: 'Не указан продукт или пакет',
    ____2146ba: 'Войдите, чтобы управлять заведением, командой и аналитикой.',
    ____2560e2: 'Заполните профиль заведения и загрузите фото',
    ____25686f: 'Размещение доступно на выбранный период.',
    ____262747: 'Тауар немесе қызметті табу',
    ____289a51: 'Перейти в раздел «Помощь»',
    ____28d61d: 'Не удалось войти через Google. Попробуйте ещё раз.',
    ____2cb815: 'Креатив отправлен на модерацию.',
    ____2eeb9c: 'Растау өтінімдері әлі жоқ.',
    ____31cba1: 'Пока нет активных кампаний',
    ____3236ca: 'Галерея карточки заведения в QalaGo',
    ____34c9f9: 'Басқару спецпредложениями для клиентов',
    ____378981: 'Кем дегенде бір рұқсат таңдаңыз',
    ____3aa9f1: 'Достигнут лимит загрузки (${maxPhotos} фото). Улучшите тариф в разделе «Тариф».',
    ____3dfe54: 'Сілтеме көшірілді в буфер обмена.',
    ____3f2e2a: 'Добавить или найти бизнес',
    ____3fb263: 'Размещение недоступно на выбранные даты.',
    ____447674: 'У вас пока нет бизнеса в QalaGo',
    ____4734e7: 'Не удалось принять приглашение. Попробуйте ещё раз.',
    ____4c8273: 'Деректер жеткіліксіз для сравнения',
    ____4e15ad: 'У вас пока нет бизнеса. Подайте заявку — после модерации откроется кабинет.',
 ____4f4875: 'Сейчас оплата имитируется без списания денег. Платные тарифы активируются на 30 дней.',
 ____58afde: 'оформлен и ожидает оплаты.',
    ____58f33e: '— удаление через приложение недоступно.',
    ____5c9c03: 'Жиі қойылатын сұрақтар и контакты поддержки',
    ____60557b: 'Агрегированные корзины расстояния, без точной карты.',
    ____606e8a: 'Почему не видно акцию в приложении?',
    ____67d60c: 'Сақтау и перейти к оплате',
    ____6928ec: 'Откройте «Менің бизнесім» → «Отзывы» или быстрые ссылки на обзоре, выберите отзыв и напишите ответ.',
    ____6982ec: 'Редактируйте карточку, часы работы и контакты в профиле заведения.',
    ____6df43a: 'Өтінім тексеруге жіберілді. Доступ к кабинету появится после одобрения.',
    ____6e26fd: 'Войдите через доступный способ авторизации.',
    ____6e6847: 'Отправьте эту ссылку сотруднику. Она действует ограниченное время и одноразовая.',
    ____724c24: 'Готовые наборы рекламных размещений',
    ____734d85: 'Жаңа келушілер — доля просмотров',
    ____75174f: 'Мақсатты әрекеттер по типам',
    ____7beeae: 'Профиль, контакты и часы работы',
    ____7c04ae: 'Каталог позициялары бойынша әрекеттер әлі өлшенбейді',
    ____7c9871: 'Шақыру жасалды. Скопируйте ссылку и отправьте сотруднику.',
    ____7d54b1: 'Доли классифицированных просмотров, не уникальные люди.',
    ____80ffc1: 'Как пройти модерацию карточки?',
    ____82ba6a: 'Өтінім QalaGo әкімшілігі тексереді.',
    ____88eb85: 'Көрсеткіштер кезеңнің агрегатталған деректері бойынша есептелген.',
    ____8af55c: ' — превышен лимит, новых менеджеров добавить нельзя',
    ____8dd23a: 'подтверждение, что вы — владелец аккаунта.',
    ____8e7898: 'Деректер жеткіліксіз по географии',
    ____8f45fb: 'У вас пока нет бизнеса в QalaGo.',
 ____93b52c: 'Когда пользователи начнут открывать вашу карточку в QalaGo, здесь появятся просмотры и другие метрики.',
    ____9578ee: 'Нажмите «Аккаунтты жою» и подтвердите действие дважды.',
    ____969588: 'Деректер жеткіліксіз по источникам',
    ____96ae05: 'телефон заменяется служебным значением',
    ____9753e3: 'Тегін — базалық лимиттер мен базалық статистика. Бизнес пен PRO — көбірек фото, тауар, акция, менеджер және кеңейтілген аналитика. VIP — максималды лимиттер және 360° аналитика (енгізілген сайын). Жазылым органикалық рейтингті көтермейді; жарнамалық орналастырулар бөлек сатылады.',
    ____998d3a: 'Поиск по названию и адресу в выбранном городе.',
    ____9c14d6: 'Мысалы: Ыстық тағамдар, Шаш кесу',
    ____a2e9ce: 'Шақыру табылмады немесе сілтеме жарамсыз.',
    ____a54708: 'Деректер жеткіліксіз по поисковым запросам',
    ____a5f597: 'Рекламные размещения приобретаются отдельно.',
    ____a8362b: 'Бизнесіңізді таппадыңыз ба?',
    ____a9d8c4: 'Заявки на добавление нового бизнеса.',
    ____ab83e1: 'Изменить тариф может только владелец',
    ____abe66e: 'Если ваш бизнес уже есть в QalaGo, запросите доступ вместо создания новой карточки.',
    ____ad8d65: 'Заявки на владение существующим бизнесом.',
    ____aecd3d: 'Бизнес будет доступен после запуска города.',
 ____b0d344: 'Вход временно недоступен: не настроен ни один способ авторизации. Обратитесь к администратору QalaGo.',
    ____b1060f: 'На текущем тарифе публикуется ограниченное число активных акций. Остальные сохранены в кабинете.',
    ____b37257: 'Что будет когда тариф закончится?',
    ____bcabc8: 'Активные и завершённые рекламные кампании',
    ____bd15ac: 'Доступно с тарифа Бизнес',
    ____bf2df1: 'Кабинетте қалай көрсетіледі',
    ____c09e09: 'Акциялар бойынша әрекеттер әлі өлшенбейді',
    ____c0be3f: 'Команданы тек мекеме иесі басқара алады.',
    ____c1ce94: 'Добавьте меню или услуги',
    ____c8085a: 'Аккаунт и управление заведением',
    ____c8191d: 'Вход по номеру телефона · OTP (тест: +77000000002, код 1234)',
 ____cdda15: '— удаление заблокировано до передачи управления другому владельцу.',
    ____ceecff: 'Тексеру нәтижесін хабарлаймыз.',
    ____d078b3: 'Пока нет уведомлений. Здесь появятся новые отзывы, статусы модерации и другие события.',
    ____d37b94: 'Заполните название, категорию, город и адрес',
    ____d8cfec: 'Менеджер командаға қосылды.',
    ____d990b1: 'После оформления заказа переведите сумму по реквизитам из этого раздела. Оплата подтверждается администратором вручную — автоматического списания нет.',
    ____db5c55: 'Перейдите в раздел «Профиль».',
    ____dd5e33: 'Как связаться с поддержкой?',
    ____dd974f: 'Как добавить товары или услуги?',
    ____de365b: 'Статистика появится после первых просмотров карточки',
    ____e1b3c0: 'В разделе «Тауарлар мен қызметтер» создайте группу (например, «Кофе») и добавьте позиции с ценой.',
    ____e4e179: 'Загрузите баннер и тексты для модерации',
    ____e70693: 'Акция должна быть «Активна», заведение — опубликовано. На Free/Basic число одновременно активных акций ограничено тарифом — лишние сохраняются в кабинете, но не публикуются.',
 ____eba489: 'Оформление подписки через кабинет пока недоступно. Информация о тарифе отображается для справки.',
    ____ec41b7: 'Чем отличаются тарифы Тегін, Бизнес, PRO и VIP?',
    ____fdc143: 'Нет просмотров позиций каталога',
    ___016439: 'Готовые наборы размещений',
    ___088df3: 'На страницу входа',
    ___181b32: 'Посетители и сессии',
    ___208573: 'Акциялар әлі жоқ',
    ___230412: 'Заказов пока нет',
    ___244d38: '📷 Фото и видео',
    ___2f5efd: 'Перейти к оформлению',
    ___31acc4: 'Вернувшиеся — доля просмотров',
    ___33efa4: 'Пока нет фото',
    ___391e3c: 'изменил права сотрудника',
    ___39747e: 'Заказ не найден',
    ___3de465: 'Заказов пока нет.',
    ___43fd9e: 'Перейти к онбордингу',
    ___4c05a7: 'Пока нет событий',
    ___4dcc9e: 'Пока нет участников',
    ___4e6492: 'Далее: креатив баннера',
    ___5633db: 'Ие құқығын растау',
    ___59bd6e: 'Пайдаланушылар не іздейді',
    ___612420: 'Өз бизнесіңізді табу',
    ___61b180: 'Жаңа бизнес қосу',
    ___64146f: 'Единственный владелец бизнеса',
    ___68cbb0: 'Телефон көрсетілмеген',
    ___6b48a6: 'Имя аккаунта сохранено',
    ___6bedb6: 'Куда ведёт клик',
    ___6de80c: 'Срок действия истёк',
    ___6e031d: 'Пікірге жауап',
    ___6f7ddf: 'Атауы немесе мекенжайы',
    ___7097f8: 'Только для владельца',
    ___72bac8: 'История рекламных заказов',
    ___74b465: '← Бар бизнесді табу',
    ___84d683: 'Позиции не найдены',
    ___84e976: '[ТРЕБУЕТ ПОДТВЕРЖДЕНИЯ ОПЕРАТОРА].',
    ___93a01e: 'Сначала сохраните черновик',
    ___9665e7: 'Тексеруге жіберу',
    ___9c4728: 'Кампания не найдена',
    ___9d7a93: 'Кампаний пока нет.',
    ___a13f56: 'Новые и вернувшиеся',
    ___a2ac3e: 'Белсенді акциялар жоқ',
    ___a38c01: 'Создайте первую акцию',
    ___a6b7f9: 'Әрекетке конверсия',
    ___b96c29: 'Желаемая дата начала',
    ___bad998: 'Вернуться в каталог',
    ___bcbf37: 'Бар бизнесді табу',
    ___be9b89: 'Пікірлер әлі жоқ',
    ___c1d1fc: 'Добавить или найти',
    ___c228da: 'Лимит фото достигнут',
    ___c312bc: 'Ближайшая доступная дата: ${formatDate(state.nextAvailableAt)}',
    ___c45ec6: 'Лимит активных акций',
    ___c89390: 'Фото и видео',
    ___cafe53: 'Өтінімдер әлі жоқ.',
    ___d0fbec: 'Как оплатить рекламу?',
    ___d9e8bc: 'не выполняется автоматически',
    ___dcc139: '📋 Тауарлар мен қызметтер',
    ___e1df5a: 'Пакет табылмады',
    ___e99e5d: 'Пакеты временно недоступны.',
    ___ee3b0e: '➕ Товар или услуга',
    ___email_3feee0: 'профиль пользователя: имя, email, предпочитаемый город;',
    ___f2125d: 'Санатпен салыстыру',
    ___f3511d: 'Өнім табылмады',
    ___f80533: 'Укажите заголовок баннера',
    ___f855bd: 'Нет активных приглашений',
    ___f97529: 'Командға шақыру',
    ___ff1357: 'Жіберу на модерацию',
    ___free_d25e9d: 'Мекеме вернётся на Free: лишние фото, товары и акции останутся в кабинете, но перестанут публиковаться сверх лимита. Уведомление придёт во «Входящие».',
    ___qalago_248e3f: 'Бонус на рекламу QalaGo',
    ___qalago_a575a4: 'Как удалить аккаунт QalaGo',
    __00fe16: 'Последние заказы',
    __02dfd9: 'Ссылка приглашения',
    __0b2e3b: 'приостановил доступ',
    __0c98ac: '✏️ Өңдеу бизнес',
    __0d3630: 'Рекламные размещения',
    __0de733: 'История изменений',
    __0fb4d5: 'К оплате',
    __10dafd: 'Все кампании →',
    __12b9df: 'Сатып алу қолжетімсіз',
    __13dad9: 'Пакеты продвижения',
    __16995d: 'Тестовая оплата',
    __19c279: 'Рекламные кампании',
    __1c4a26: 'Тапсырыстарым',
    __24c04c: 'Запустить рекламу',
    __2500_f917c1: 'Цена, например 2500',
    __255eae: 'Дс–Жм',
    __258fc4: 'Өтінім жіберілді',
    __259ff5: 'Загрузка позиций…',
    __26287a: 'Загрузить фото',
    __288711: 'Құқықтық ақпарат',
    __2a51a6: 'Может сохраняться',
    __2ab419: 'Иесінің аты',
    __2add9a: 'Көздер просмотров',
    __2ca0e5: 'отозвал доступ',
    __2ea91d: '← К каталогу',
    __31c205: 'Banner тақырыбы',
    __330e3e: 'Создание заказа…',
    __343d9a: 'Шақыруды қабылдау',
    __3858f6: 'Подключить (тест)',
    __399e64: 'Кабинетті ашу',
    __3a1b5c: 'Қараулар акций:',
    __3b30e8: 'Бизнес қосу',
    __3da024: 'Менің өтінімдерім',
    __3ddda6: 'Басты бетке',
    __3f888c: 'Заявка отменена',
    __404816: 'Жаңа акция',
    __41649d: '← К списку',
    __430244: 'Добавить позицию',
    __44e6ac: 'Добавить группу',
    __49a9d5: 'Создать заказ',
    __4c29c5: 'Текущий тариф',
    __4c9370: 'Базовая цена',
    __4dc0ec: 'Тапсырыс жасалды',
    __510fe5: 'не предусмотрена',
    __542ad0: 'Изображение баннера',
    __5453e6: 'Отменить заявку',
    __55b89b: 'Купить размещение',
    __591eff: '📣 Запустить рекламу',
    __5a427f: 'Расчёт стоимости',
    __5b8b2a: 'Обновить ответ',
    __5ddc33: 'Мақсатты әрекеттер',
    __5e77e4: 'Жұмыс уақыты',
    __5f059f: '← К пакетам',
    __618c5e: 'Құқықты растау',
    __629993: 'Пакет продвижения',
    __62b5a0: 'Құқықты растау',
    __62b685: 'Қысқа сипаттама',
    __65f9d8: '← Басты бетке',
    __666e84: 'Шақыру кері алынды',
    __6a0817: 'Скидка тарифа',
    __6b310c: 'после одобрения',
    __6b8b2e: 'Недавние действия',
    __6be76b: 'Қолжетімділік жоқ',
    __6cc61b: 'Қолжетімділік рұқсаттары',
    __7__0205a6: 'Действия за 7 дней',
    __7__c0883e: '7 күндегі қараулар',
    __7094b4: 'Өтінім жіберу',
    __72307b: 'Все заказы →',
    __733f68: 'Статус кампании',
    __74bc05: 'Жіберу код',
    __750e6a: ' · ${unanswered} без ответа',
    __77b793: 'Батырма мәтіні',
    __78eefe: 'Тарифті пайдалану',
    __798c20: 'Загрузка пакетов…',
    __79b074: 'Подробная статистика →',
    __7a5b4f: 'Белсенді акциялар',
    __8062f8: 'Акция жасау',
    __815828: 'Жоба сақталды',
    __81f7be: 'восстановил доступ',
    __85a5da: 'Загрузка расчёта…',
    __8c3081: 'Поисковые запросы',
    __8f4ecc: 'Топсыз',
    __8f77f2: 'принял приглашение',
    __9376fb: 'Ожидает принятия',
    __94ed98: 'Менің бизнесім',
    __997367: 'Иесінің жауабы',
    __99d79f: 'Приглашение недоступно.',
    __9a1a00: 'Новый заказ',
    __9b14e9: 'Подкатегории сохранены',
    __9b9ea3: 'Новое размещение',
    __9f78eb: 'Ваш ответ:',
    __a0b38a: 'Запрошенный старт',
    __a1281f: 'Жаңа позиция',
    __a144ec: 'Быстрые ссылки',
    __a18ab6: 'Состав заказа',
    __a459d5: 'Мекеме профилі',
    __a4ce5c: '🏷️ Акция жасау',
    __a4efab: 'Товар / услуга',
    __a6eca2: 'Администраторы платформы',
    __a849d7: 'Карточка заведения',
    __affb23: 'Заңи құжаттар',
    __apple__c741a3: 'Отзыв авторизации Apple на стороне Apple',
    __audit__f2a5f6: 'заказы, платежи, audit-логи — основания хранения [ТРЕБУЕТ ПОДТВЕРЖДЕНИЯ ЮРИСТА];',
    __b05019: 'Быстрые действия',
    __b34c5f: 'Құпиялылық саясатымен',
    __b43615: 'Выбрать файл',
    __b81c87: 'Пакет құрамы',
    __b8c6a7: 'Жарнама статистикасы →',
    __badd65: 'Танымал часы',
    __bb0bac: 'Без текста',
    __bb49cc: 'Активные кампании',
    __bbd5d8: 'Загрузка статистики…',
    __bdaf3d: 'ваши отзывы;',
    __c2265b: 'Связанные кампании',
    __c2f48f: 'пригласил сотрудника',
    __c50655: 'Басқару группами',
    __c50c8f: 'Отменить заявку?',
    __c53959: 'Загрузка каталога…',
    __c6125a: 'Активно до ${formatDate(state.activeUntil)}',
    __c63d55: 'Загрузка тарифов…',
    __c660cc: 'Детали кампании',
    __c6b09a: 'Без описания',
    __c9b745: 'Все кампании',
    __cccdb7: 'Менеджерді шақыру',
    __cd6c16: 'Квалиф. показы',
    __cd92a5: 'Нет изображения',
    __ce5cf6: 'Фактический период',
    __d6e9b9: 'Продвигаемая акция',
    __d80281: 'Ожидающие приглашения',
    __d94b6a: 'Тарифтерді көру',
    __d9d74d: 'Модерацияда',
    __db64ed: 'Внешняя ссылка',
    __dd3834: 'Акцияны насихаттау',
    __de315a: 'Дата начала',
    __ded83d: 'Выбрать размещение',
    __e1ba6e: 'График просмотров',
    __e2b6e8: 'Жобаны сақтау',
    __e3d304: 'Все акции',
    __e747ec: 'Тағы көрсету',
    __e7b2f6: 'Детали заказа',
    __ebd04c: 'Рекламные продукты',
    __ed0248: 'Барлығын оқу',
    __ee11a4: 'Загрузка приглашения…',
    __ef4a34: 'Жылдам бастау',
    __email_46d244: 'По ссылке (email)',
    __f50d06: 'Оформление заказа',
    __f626fa: 'Уже принято',
    __f71231: 'Науқандарым',
    __f83057: 'Новый бизнес',
    __fa3ac6: 'Сравнение периодов',
    __fb56a2: 'Жаңа топ',
    __fdb02d: 'Изменения сохранены',
    __fe2c89: 'Жаңа пікір',
    __free_3507fe: 'Вернуться на Free',
    __legacy_842eec: 'По телефону (legacy)',
    __pro_7effee: 'Доступно с PRO',
    __qalago__d094f0: 'QalaGo-ға кіріңіз, чтобы принять приглашение.',
    __qalago_707df4: 'Удаление аккаунта — QalaGo',
    __qalago_876cc9: 'Удаление аккаунта QalaGo',
    __sms_82ec53: 'SMS коды',
    __support_qalago_264d57: 'Напишите на support@qalago.kz или в WhatsApp +7 777 000 00 00 (MVP — демо-контакт). Укажите название заведения и номер телефона аккаунта.',
    __vip__e0fb5c: 'Далее: креатив VIP-bannerа',
    __vip_111d64: 'Доступно с VIP',
    _csv_bfd8aa: 'CSV экспорт',
    _vip___89ff3c: 'Креатив VIP-bannerа привязан к заказу и будет отправлен на модерацию төлемнен кейін.',
    _vip___93dfa0: 'Включает VIP-banner — потребуется креатив и модерация.',
    _vip___a86cb0: 'Период VIP-размещения начинается после одобрения баннера модератором.',
    _vip___d83c5c: 'Для VIP-bannerа нужно загрузить креатив. После оформления заказа баннер отправится на модерацию.',
    _vip__4c7126: 'Креатив VIP-bannerа',
    '2____cbc60d': '2. Если приложение недоступно',
    '3____592fe4': '3. Что происходит при удалении',
    '4__922545': '4. Ограничения',
    '5___2c16a5': '5. После удаления',
    '6___9ffbf2': '6. Бизнес кабинеті',
    ctr___69b910: 'CTR и воронка',
    email____1ae98f: 'email провайдера или маскированный телефон, если известны;',
    email__ab06da: 'Email менеджера',
    jpg_png__5_f0b0b6: 'JPG/PNG до 5 МБ. Первое фото можно сделать обложкой автоматически.',
    legalAccountDeletionLink: 'Аккаунтты жою',
    legalDraftNotice:
      'Қолданбаның нақты міндет-тәуіркесіндегі жоба. Production-ға жариялау алдында заңгердің тексеруі қажет.',
    legalPrivacyLink: 'Құпиялылық саясаты',
    legalProductionUrlNote: 'Production URL: {url} (qalago.kz-ге орналастырғаннан кейін)',
    legalTermsLink: 'Пайдалану шарттары',
    legalUpdatedLabel: 'Жаңартылды',
    ownerMgmtMyBusiness: 'Менің бизнесім',
    ownerMgmtPromotions: 'Акциялар',
    ownerNavAnalytics: 'Статистика',
    ownerNavHelp: 'Көмек',
    ownerNavMessages: 'Хабарландырулар',
    ownerNavOverview: 'Шолу',
    ownerNavPlan: 'Тариф',
    ownerNavPromote: 'Жарнама және насихат',
    ownerNavSettings: 'Баптаулар',
    ownerNavTeam: 'Команда',
    ownerPermissionCatalogEdit: 'Тауарлар мен қызметтер',
    ownerReviewReportAction: 'Пікірге шағымдану',
    ownerReviewReportReasonLabel: 'Шағым себебі',
    ownerReviewReportReasonSpam: 'Спам',
    ownerReviewReportReasonInappropriate: 'Орынсыз мазмұн',
    ownerReviewReportReasonFalseInfo: 'Жалған ақпарат',
    ownerReviewReportReasonHarassment: 'Қорлау немесе мазалау',
    ownerReviewReportReasonOther: 'Басқа',
    ownerReviewReportDetailsOptional: 'Түсініктеме (міндетті емес)',
    ownerReviewReportSubmit: 'Шағымды жіберу',
    shellCloseNavigation: 'Менюді жабу',
    shellCollapseMenu: 'Менюді жию',
    shellLogout: 'Шығу',
    shellOpenNavigation: 'Менюді ашу',
    shellSoonBadge: 'жақында',
    text_mediaArchivedAfterUpgrade: 'тарифті көтергеннен кейін сақталады және қайта пайда болады.',
    text_menuShownCount: 'Көрсетілген ${shown} / ${total}',
    contentAuthoredTitleKkOptional: 'Қазақшадағы атау (міндетті емес)',
    contentAuthoredDescriptionKkOptional: 'Қазақшадағы сипаттама (міндетті емес)',
    ownerPlanQuotaMenuLine:
      'Тариф «${planName}»: ${used} / ${max} тауар мен қызмет',
    ownerPlanQuotaPublishedSuffix: ' · жарияланған ${count}',
    ownerPlanQuotaMenuOverLimitLine:
      'Ағымдағы тарифте ${max} позицияға дейін жарияланады. Қалғандары кабинетте сақталған.',
    ownerPlanQuotaPromotionsLine:
      'Тариф «${planName}»: белсенді ${active} / ${max} · акция мерзімі ${days} күн.',
    ownerPlanQuotaPhotosLine: 'Тариф «${planName}»: ${used} / ${max} фото',
    ownerPlanPaymentHistoryTitle: 'Тариф төлемдері тарихы',
    ownerPlanPaymentHistoryEmpty: 'Төлемдер әлі жоқ.',
    ownerSectionAccessDeniedTitle: 'Бұл бөлімге қолжетімділік жоқ.',
    ownerSectionAccessDeniedHint: 'Сіздің рөліңізде қажетті құқықтар жоқ.',
    ownerSectionAccessDeniedAction: 'Шолуға оралу',
    ownerPlanMockPaymentTag: 'тест',
    ownerPlanQuotaPhotosOverLimitPrefix:
      '«${planName}» тарифінде ${max} фотоға дейін жарияланады. Қалғандары',
    mediaScopeBrand: 'Ортақ фото',
    mediaScopeBranchesHeading: 'Филиалдар',
    mediaScopePrimarySuffix: 'негізгі филиал',
    mediaScopeBranchPhotosHeading: 'Филиал фотосы',
    mediaEmptyBrand:
      'Ортақ фото бүкіл бизнес үшін көрінеді және әр филиал галереясын толықтырады. Алғашқы суретті жүктеңіз.',
    mediaEmptyBranch:
      'Мұндағы фото тек таңдалған филиал үшін көрсетіледі (ортақ фотодан бұрын). Алғашқы суретті жүктеңіз.',
    mediaGallerySectionTitle: 'Галерея (${count})',
    mediaScopeLoadingLocations: 'Филиалдар жүктелуде…',
    ownerPromotionsListHeading: 'Тізім (${count})',
    serviceItemEditTitle: 'Позицияны өңдеу',
    serviceItemEditAction: 'Өзгерту',
    serviceItemEditSave: 'Сақтау',
    serviceItemEditSaved: 'Позиция сақталды',
    promotionEditTitle: 'Акцияны өңдеу',
    promotionEditAction: 'Өзгерту',
    promotionEditSave: 'Сақтау',
    promotionEditSaved: 'Акция сақталды',
    branchAvailabilityHeading: 'Филиалдар бойынша қолжетімділік',
    branchAvailabilityModeAll: 'Барлық филиалдарда',
    branchAvailabilityModeSelected: 'Таңдалған филиалдарда',
    branchAvailabilityPrimaryBadge: 'Негізгі филиал',
    branchAvailabilitySelectAtLeastOne: 'Кем дегенде бір филиал таңдаңыз',
    branchAvailabilityBranchUnavailable:
      'Филиал қолжетімсіз — таңдауды жаңартыңыз немесе «Барлық филиалдарда» режиміне оралыңыз',
    branchAvailabilityNoBranches:
      'Таңдауға филиал жоқ. «Филиалдар» бөлімінде мекенжай қосыңыз немесе «Барлық филиалдарда» қалдырыңыз.',
    branchAvailabilityMissingUnresolved:
      'Сақтау блокталды: бұрын таңдалған филиалдардың бірі қолжетімсіз. Режимді өзгертіңіз немесе филиалдар тізімін жаңартыңыз.',
    text_setAsCover: 'Мұқабаға',
    text_findShort: 'Іздеу',
    text_deleteGroup: 'Топты жою',
    text_saveSubcategories: 'Ішкі санаттарды сақтау',
    ownerEditPermissions: 'Құқықтарды өзгерту',
    ownerSuspend: 'Тоқтату',
    text_revokeAccess: 'Қолжетімділікті алу',
    text_savePermissions: 'Құқықтарды сақтау',
    text_cancel: 'Бас тарту',
    text_resumeAccess: 'Қолжетімділікті қалпына келтіру',
    text_revokeInvite: 'Шақырудан бас тарту',
    text_teamInviteHint1: 'Қызметкер email-ін көрсетіп, құқықтарды таңдаңыз. Жасалғаннан кейін сілтемені көшіріп жіберіңіз',
    text_teamInviteHint2: 'қызметкерге (email, мессенджер т.б.). Пайдаланушы осы email-пен тіркелген болса,',
    text_teamInviteHint3: 'қолжетімділік бірден берілуі мүмкін.',
    text_copyInviteLink: 'Сілтемені көшіру',
    text_hide: 'Жасыру',
    text_supportWhatsappHours: 'WhatsApp: +7 777 000 00 00 · дс–жм 10:00–19:00 (UTC+5)',
    text_loginByPhone: 'Телефон арқылы кіру',
    text_loginDevNoSms: 'SMS-сыз кіру',
    checkoutMissingProductOrPackage: 'Өнім немесе пакет көрсетілмеген.',
    checkoutOrderAmountPrefix: 'Тапсырыс сомасы',
    text_checkoutManualPay1: 'Орналастыруды белсендіру үшін «Көмек» бөлімінде көрсетілген реквизиттерге аударыңыз',
    text_checkoutManualPay2: 'және төлемді әкімші растауын күтіңіз. Автоматты есептен шығару',
    text_checkoutManualPay3: 'жоқ — тапсырыс статусы қолмен расталғаннан кейін жаңартылады.',
    text_checkoutCreateOrder1: '«Тапсырыс жасау» батырмасын басу арқылы тапсырысты растайсыз. Төлем қолмен жүргізіледі —',
    text_checkoutCreateOrder2: 'әкімші растағаннан кейін ғана «Төленген» статусына өтеді.',
    text_orderPartialVip1: 'Пакет ішінара белсенді: VIP-сыз орналастырулар іске қосылған немесе жоспарланған. VIP-banner',
    text_orderPartialVip2: 'модератор креативті мақұлдағаннан кейін көрсете бастайды — оған дейін VIP кезеңі басталмайды.',
    text_orderAwaitingPay1: 'Тапсырыс қолмен төлемді күтуде. Ақша аударылғаннан кейін әкімші төлемді растайды —',
    text_orderAwaitingPay2: 'осыған дейін науқандар белсендірілмейді.',
    text_promoForAds: 'Насихаттау акциясы',
    text_packageVipCreative1: 'Пакет VIP-bannerды қамтиды. Алдымен креатив дайындаңыз — VIP орналастыру кезеңі',
    text_packageVipCreative2: 'banner мақұлданғаннан кейін басталады. Пакеттің басқа орналастырулары',
    text_afterPayment: 'төлемнен кейін белсендіріледі.',
    text_moderatorMessageOptional: 'Модераторға хабарлама (міндетті емес)',
    text_backLink: '← Артқа',
    text_cancelAction: 'Бас тарту',
    text_planBonus1: 'Айлық бонус — QalaGo жарнама өнімдерін төлеуге арналған ішкі кредит.',
    text_planBonus2: 'Бұл қолма-қол ақша, cashback немесе шығарылатын баланс емес. Бонус есептелуі',
    text_planBonus3: 'есептеу моделі енгізілгеннен кейін қолжетімді болады (Stage 6.4 — тарифтерде көрсету ғана).',
    text_planDisclaimer1: 'Жазылым каталогтағы органикалық рейтингті арттырмайды. Жарнама орналастырулар',
    text_planDisclaimer2: ' бөлек сатып алынады. Тариф жеңілдігі жеке жарнама өнімдеріне',
    text_planDisclaimer3: 'тапсырыс рәсімдеу кезінде қолданылады және төлем тарихында тіркеледі.',
    text_settingsAuthHint1: 'Google, Apple немесе OTP арқылы кіру (қосулы болса). Тұтынушы аккаунтын жою —',
    text_settingsAuthHint2: 'QalaGo мобильді қолданбасында.',
    text_funnelAggregateTitle: 'Шұңқыр (кезең агрегаты)',
    text_geoDistanceTitle: 'География (қашықтық)',
    text_continueWithApple: 'Apple арқылы жалғастыру',
    text_014f35: 'Кампании',
    text_047e75: 'Белсенді',
    text_065a4b: 'Оформление',
    text_069c9c: 'Город',
    text_09543f: ' · ${unread} непрочитанных',
    text_09825a: 'Базовая',
    text_0b4604: 'Настроить',
    text_0d1896: 'Приглашение',
    text_125cda: 'Подкатегории',
    text_1658f7: ' (публикуется ${planStatus.entitlements.activePromotions.published})',
    text_1c3fea: 'Пікірлер',
    text_1c5009: 'Бизнес',
    text_1d3bf8: 'Онбординг',
    text_1ec8bd: 'Төленген',
    text_20857d: 'Сравнение',
    text_2252aa: 'Полная',
    text_278bed: 'Алдын ала көру',
    text_2928e1: 'Телефон',
    text_2b02ca: 'Выбрать',
    text_2b0b02: 'Артқа',
    text_2b1305: 'Отозвано',
    text_2c34bf: 'Параметры',
    text_2d3f73: 'Подключение…',
    text_2f1160: 'Анонимизируется',
    text_30474d: 'Размещение',
    text_318150: 'Белсенді',
    text_3677ee: 'Қауіпсіздік',
    text_382d73: 'Размещения',
    text_38ca0a: 'Сипаттама',
    text_3a8930: 'навсегда',
    text_3ae691: 'уведомления;',
    text_3e177a: 'Активировать',
    text_3f4e8c: 'Позиции',
    text_424b69: 'Модерация',
    text_480107: 'Контент',
    text_4dc45b: 'Заполненность',
    text_4e3e1b: 'Мекеме',
    text_4ec712: 'Пакеты',
    text_50df78: 'Жалпы',
    text_5427be: 'Мекеме:',
    text_54a59b: 'Сақталды',
    text_54b0a7: 'Қараулар',
    text_558981: 'Тақырып *',
    text_558e9d: 'Ұсыныстар',
    text_59dca9: 'Детали',
    text_5a65ee: 'Акция ${row.promotionId.slice(0, 8)}…',
    text_5aa92b: 'Удаляется',
    text_5e134c: 'Шақыру',
    text_602680: 'Атауы',
    text_61dee7: 'Сайт',
    text_63a753: 'Кіру',
    text_63d0ff: 'мес',
    text_64d5d6: 'Доля',
    text_66008b: 'Тартулар',
    text_67c7f6: 'Запрос',
    text_69eca8: 'Атауы *',
    text_6a21b9: 'Мекенжай *',
    text_6ba3c7: 'Іздеу',
    text_6efd63: 'Іздеу…',
    text_7203f7: 'Күйі',
    text_73dba4: 'Сақталуда…',
    text_7407ba: 'Мұқаба',
    text_74ea58: 'Сақтау',
    text_75768c: 'Байланыс',
    text_76e286: '← Обзор',
    text_772843: 'Текущий',
    text_786af9: 'Предыдущий',
    text_79b6dc: 'География',
    text_7a1120: 'Источник',
    text_7aa4a8: '${campaigns.length} кампаний',
    text_7ae745: 'Метрика',
    text_7d2cdd: 'Жақында',
    text_7ed121: 'немесе',
    text_7f4c33: 'Исправить',
    text_80148f: 'Мекенжай',
    text_81c9da: 'да',
    text_849983: 'Подтверждение',
    text_858580: 'Изменение',
    text_85aa47: 'Старт',
    text_85b226: 'Қатысушылар',
    text_89d69a: 'Загрузка…',
    text_8cdd8b: 'Дата',
    text_8d35fc: 'Переходов',
    text_8d8c85: 'Система',
    text_8eabdb: ' (публикуется ${planStatus.entitlements.photos.published})',
    text_8f1e4c: '🏷️ Акции',
    text_8fc4bc: 'Оплаты',
    text_98462d: 'Клики',
    text_984bf1: 'Барлығы',
    text_a1ceab: 'Аккаунт',
    text_a2aa4c: 'Жіберілуде…',
    text_a46c37: 'Профиль',
    text_aa48fa: 'Жексенбі',
    text_ab6cb7: 'Недоступно',
    text_ad5122: 'Каталог',
    text_b0e3a5: 'Завершить',
    text_b14e2a: 'Аудитория',
    text_b5461e: 'Дайындалуда…',
    text_b7697b: 'Корзина',
    text_b911f5: 'Жоспарланған',
    text_b914bb: 'Қайталап көру',
    text_bc921d: ' (+${planStatus.team.pendingInvitations} приглаш.)',
    text_becb26: 'Жарнама',
    text_bf3be1: '${periodDays} дн.',
    text_bfc959: 'Іздеу',
    text_c25cef: 'Көрсетулер',
    text_c2a996: 'Көздер',
    text_c5819f: 'избранное;',
    text_c5ffa7: 'Өнім',
    text_cee58b: 'Сенбі',
    text_cf59eb: 'Сумма',
    text_d0bf2a: 'Город *',
    text_d24286: ' · скрыта',
    text_d2ed72: 'Хабарландырулар',
    text_d6537c: ' (публикуется ${planStatus.entitlements.serviceItems.published})',
    text_d6d264: 'Номер',
    text_d71ec3: 'Санат *',
    text_d8d7ab: '${plan.limits.monthlyAdBonusKzt.toLocaleString(\'ru-RU\')} ₸/мес',
    text_d90396: 'Жеңілдік',
    text_d9c36c: 'Продукты',
    text_da78ed: 'Кабинет',
    text_db5f55: 'Толығырақ',
    text_dbe544: 'Жаңарту',
    text_ddfaba: 'Қабылдануда…',
    text_df0d49: 'Акция',
    text_df28b6: 'нет',
    text_e073be: 'Динамика',
    text_e093c1: 'Иесі',
    text_e0fc47: 'заведения',
    text_e35653: 'Креатив',
    text_e50f70: '${formatChartDate(p.date)}: ${p.v} просмотров',
    text_e5681e: 'Жауап беру',
    text_e640a8: 'Орал',
    text_e76db3: '⭐ Отзывы',
    text_e93a9b: 'Запрошено: ${formatDateTime(c.requestedStartAt)}',
    text_e946df: 'Открыть',
    text_e9c3a6: 'Жалғастыру',
    text_ec65a7: 'Разделы',
    text_ed2bbf: 'Жою',
    text_edcf39: 'Барлығы',
    text_f0e9ac: ' · страница ${pagination.page} / ${pagination.totalPages}',
    text_f154d6: 'Пайдаланушы',
    text_f1a7d3: 'Расширенная',
    text_f90bfb: 'Кезең',
    text_f9852f: 'Кампания',
    text_fa9392: 'Состав',
    text_fb3df3: 'Әрекеттер',
    text_ffb605: 'Длительность',
    top__vip__239541: 'TOP, буст, VIP-banner и др.',
  },
};

export function siteMetadataForLocale(locale: AppLocale): { title: string; description: string } {
  const labels = UI_LABELS[locale];
  return { title: labels.siteTitle, description: labels.siteDescription };
}

/** Interpolate {name} placeholders in UI strings. */
export function formatUi(template: string, vars: Record<string, string | number>): string {
 return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? '')); } 