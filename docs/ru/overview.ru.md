# Liquid Prnc Glass — обзор

Liquid Prnc Glass — standalone WebGL/GLSL лаборатория эффекта жидкого стекла для видео, изображения или другого visual source.

Сайт проекта: [http://liquid-prince.online/](http://liquid-prince.online/)  
GitHub: [https://github.com/i4w7w4a/Liquid_Prnc_Glass](https://github.com/i4w7w4a/Liquid_Prnc_Glass)

## Суть

Это не CSS blur, не `backdrop-filter` и не декоративный overlay.

Ядро эффекта:

```text
source texture -> Three.js renderer -> GLSL shader -> optical refraction
```

Проект нужен как лаборатория одной техники: настроить, проверить, экспортировать и перенести WebGL liquid-glass refraction в другой проект без потери смысла.

## Где смотреть

- UI и состояние: `src/App.tsx`
- React/WebGL мост: `src/liquid-glass/WebGLVideoEdgeGlass.tsx`
- Renderer и shader: `src/liquid-glass/WebGLVideoEdgeGlassRenderer.ts`
- Настройки и preset parser: `src/liquid-glass/settings.ts`
- Экспорт brief: `src/liquid-glass/integrationBrief.ts`

## Правило

Каждое изменение должно отвечать на один вопрос:

```text
Стало ли стекло убедительнее, управляемее, переносимее или проверяемее?
```

Если нет, это шум.
