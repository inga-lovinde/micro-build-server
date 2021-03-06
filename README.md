﻿micro-build-server
==================


Разработка
==========

Установить Node.js v6.

Запустить `npm install` из папки `BuildServer`.

Создать `app.ts` на основе `app.ts.example`.

Для проверки code style / типов использовать `npm test`.

Установка на сервере
====================

Установить Node.js v6.

Скопировать на сервер собранный проект (содержимое папки `bin\Release`) `DotNetBuilder`.

Установить в GAC сборки `Newtonsoft.Json, Version=6.0.0.0, Culture=neutral, PublicKeyToken=30ad4fe6b2a6aeed` (можно взять из релиза 6.0.4 с NuGet), `Microsoft.VisualStudio.Setup.Configuration.Interop, PublicKeyToken=b03f5f7f11d50a3a`.

Склонировать репозиторий (`git clone`).

Запустить `npm install` из папки `BuildServer`.

Создать `app.ts` на основе `app.ts.example` (для использования в IIS надо указать `port: process.env["PORT"]`).
Пути `gitpath`, `releasepath`, `tmpcodepath` должны быть максимально короткими.

Проверить, что `app.ts` правильный с помощью `npm test`.

Собрать с помощью `npm build` или `npm run build`.

Запускать с помощью `npm start` или `node app`.
Для использования в IIS - установить iisnode, создать в iis сайт, указывающий на корневую папку `BuildServer` (в которой лежит `Web.config`).

Возможно, в зависимости от сценариев использования, также понадобится установить на сервер Microsoft .NET Targeting Pack и Windows SDK нужной версии.

Обновление сервера
==================

```
git pull origin master
npm test
npm run build
```

Использование
=============

В настройках нужного репозитория (и его форков) указать адрес хука: `https://micro-build-server/github/postreceive`.

Добавить в корневую папку репозитория файл `mbs.pos` с содержимым следующего вида:

```
{
	"type": "sequential",
	"params": {
		"tasks": [
			{
				"type": "dotnetbuild",
				"params": {
					"solution": "Legacy.Processing.Common.sln",
					"forceCodeAnalysis": "true"
				}
			},
			{
				"type": "dotnetnugetprocess",
				"params": {
					"masterRepoOwner": "Legacy",
					"nuspecName": "Legacy.Processing.Common",
					"major": "4"
				}
			}
		]
	}
}
```

Со списком возможных типов задач и их параметров можно ознакомиться в папке `BuildServer\lib\tasks`.

Для добавления новой задачи достаточно добавить новый файл `yourtaskname.ts` в эту папку.

Для получения информации о статусе сборки достаточно добавить в README.md нужного репозитория строчку

```
![Status](https://micro.build.server/status.svg)
```

Или вручную перейти на страницу с отчётом о сборке - для этого надо поменять в адресной строке адрес `https://github.enterprise/what/ever` на `https://micro.build.server/github.enterprise/what/ever`.

В обоих случаях будет отображена информация о сборке нужной ветки / нужного коммита.
