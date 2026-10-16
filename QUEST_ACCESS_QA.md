# Quest access QA — Geiger Goes Silent

## Контекст и единая проверка

`engine.js`: `canInteractWithQuest(quest, action, choice)` возвращает разрешение и причину.
Проверяет существующие `explorationActive`, `expedition.active`, `event`, `combat`, `travelTo` и режим игры. Новых флагов занятости нет. Открытие журнала не ограничено.

Эта проверка используется обработчиками принятия, ручной/автоматической сдачи, эффектом `startQuest`, выбором события и проекцией quest UI. Прямые вызовы `Engine.action('acceptQuest'/'turnIn')` не получают разрешения текущего события.

## NPC и метаданные

`living-zone.js`: `npcAvailable(state, npcId, location)` использует существующие `peopleAt`, локальные world modifiers, `ZoneRPGZone.npcVisible`, требования предыстории, отношения `dead` и `ZoneRPGStories.npcPresent`.

Основные метаданные сохранены: `giver`, `giverLocations`, `turnInLocations`. Для личных заданий добавлены ID фактического контакта `giverNpcId` и `turnInNpcId`; остальные задания используют существующий `giver` как fallback.

Пропавший Саша недоступен до главы 4 (нулевой индекс 3), Егор — до главы 5 (нулевой индекс 4), после этапа его вывода/охраны. Описание старых записей использует ту же проверку присутствия. Недоступные NPC не предлагаются как собеседники в списке людей.

Чтобы запрет общения с пропавшим персонажем не блокировал ранние главы, исправлены только контакты отчёта:

- `personal_soldier_2`: Вязов на Блокпосте вместо пропавшего Саши.
- `personal_hunter_1`: Ника в Каменоломне вместо пропавшего Егора.

ID, счётчики и награды заданий сохранены. Подписи отчёта и соответствующие кнопки людей используют фактического получателя.

## Исключения текущего события

Разрешение сверяется с определением текущего события, текущим stage ID, фазой `choices`, явным `effects.startQuest` / `action: turnIn` + quest ID и уже использованными действиями. Имя NPC само по себе ничего не разрешает. Выбор должен реально существовать в определении текущего этапа.

Для 36 личных заданий контакты получили явные предложения/сдачу с условием текущей главы. Это не открывает другие задания того же NPC. Изменена только возможность разговора о конкретном поручении.

Существующие полевые задания по записям имеют `questSource: field`; два существующих радиособытия (`radio_silent_call`, `quest_signal_underpass`) — `questSource: signal`. Их конкретные сценарные предложения сохранены; это не разрешение удалённого принятия из журнала и не обещание физического присутствия пропавшего NPC.

## UI

Журнал доступен во время исследования. Обычные кнопки «Принять» и «Сдать» остаются видимыми, но disabled. Причины передаются через существующий `title`-паттерн: исследование/встреча либо недоступность персонажа. Событийные кнопки используют ту же проверку, сохраняя стиль списка выбора. Action slot и структура карточек не изменены.

## Совместимость

`state.js` и `save.js` не изменены. Schema 16, `zonerpg_manual_save`, `zonerpg_autosave`, legacy keys и `window.ZoneRPG*` сохранены. Старый прогресс загружается без миграции и без перезаписи исходного manual save. В тесте сравниваются все прежние quest ID, цели, награды и основные механические поля.

Отдельно проверена неизменность кода боя, оружия, торговли, выживания, характеристик, отдыха, часов и загрузки.

## Реальная browser QA

Локальная изолированная fixture на `/GeigerGoesSilent/` с настоящими engine/UI и тестовым sessionStorage:

- приём и сдача на базе;
- настоящий запуск исследования через кнопку, затем открытие журнала;
- disabled приём и сдача с правильными причинами;
- принятие предложения Кардана в событии;
- сдача «Первого маршрута» Сидоровичу в событии, награда 450 ₽;
- невозможность сдачи недоступному NPC;
- ширины 1280 / 768 / 480 / 360: журнал читаем, горизонтального overflow нет;
- console: 0 errors/warnings в проверенных сценариях.

Скриншоты в соседней QA-папке: `quest-access-360.jpg` и `quest-access-live-360.jpg`.
Произвольные сочетания сюжетных флагов не перебирались вручную в браузере; граф историй и обе ветки всех шести предысторий покрыты Node suites.

## Автоматические проверки

- Полный Node-прогон: **554 PASS, 0 FAIL, 40 suites** (включая все варианты основного сюжета).
- Финальный `tests/quest-access.cjs`: **16 PASS, 0 FAIL**, включая дополнительную проверку cooldown. Этот набор пересекается с полным прогоном; числа не суммируются.
- Все JS/CJS: **73 файла, node --check PASS**.
- `git diff --check`: **PASS**, exit 0.
- Все шесть личных историй: обе ветки каждой, сохранение/загрузка, завершение и награды — PASS.
- Старые quest progress и исходная manual-запись сохраняются — PASS.
- Browser QA указанных сценариев и ширин — PASS; ошибок консоли не обнаружено.

Исторические brand/art/source guards уточнены: допускают только новые quest-source metadata; совместимость save/schema и прочих систем проверяется отдельно. UI fixtures теперь явно задают разрешение взаимодействия, а проверки сохранности quest progress не сравнивают контекстные UI permissions как игровое состояние. Проверки старого name feature продолжают защищать его обработчик и autosave список.

## Изменённые и новые файлы

- `C:\Users\regin\Documents\Codex\2026-10-04\https-openai-com\outputs\GeigerGoesSilent\engine.js`
- `C:\Users\regin\Documents\Codex\2026-10-04\https-openai-com\outputs\GeigerGoesSilent\living-zone.js`
- `C:\Users\regin\Documents\Codex\2026-10-04\https-openai-com\outputs\GeigerGoesSilent\narrative.js`
- `C:\Users\regin\Documents\Codex\2026-10-04\https-openai-com\outputs\GeigerGoesSilent\personal-stories.js`
- `C:\Users\regin\Documents\Codex\2026-10-04\https-openai-com\outputs\GeigerGoesSilent\tests\art-pack.cjs`
- `C:\Users\regin\Documents\Codex\2026-10-04\https-openai-com\outputs\GeigerGoesSilent\tests\branding.cjs`
- `C:\Users\regin\Documents\Codex\2026-10-04\https-openai-com\outputs\GeigerGoesSilent\tests\browser-fixture.js`
- `C:\Users\regin\Documents\Codex\2026-10-04\https-openai-com\outputs\GeigerGoesSilent\tests\geiger-branding.cjs`
- `C:\Users\regin\Documents\Codex\2026-10-04\https-openai-com\outputs\GeigerGoesSilent\tests\player-name.cjs`
- `C:\Users\regin\Documents\Codex\2026-10-04\https-openai-com\outputs\GeigerGoesSilent\tests\repo-path.cjs`
- `C:\Users\regin\Documents\Codex\2026-10-04\https-openai-com\outputs\GeigerGoesSilent\tests\stories.cjs`
- `C:\Users\regin\Documents\Codex\2026-10-04\https-openai-com\outputs\GeigerGoesSilent\tests\ui-v11.cjs`
- `C:\Users\regin\Documents\Codex\2026-10-04\https-openai-com\outputs\GeigerGoesSilent\tests\world-logic.cjs`
- `C:\Users\regin\Documents\Codex\2026-10-04\https-openai-com\outputs\GeigerGoesSilent\ui.js`
- `C:\Users\regin\Documents\Codex\2026-10-04\https-openai-com\outputs\GeigerGoesSilent\world.js`
- `C:\Users\regin\Documents\Codex\2026-10-04\https-openai-com\outputs\GeigerGoesSilent\tests\quest-access.cjs`
- `C:\Users\regin\Documents\Codex\2026-10-04\https-openai-com\outputs\GeigerGoesSilent\QUEST_ACCESS_QA.md`

Commit и push не выполнялись. Изменения оставлены в рабочем дереве.
