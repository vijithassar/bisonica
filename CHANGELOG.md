# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.1.10](https://github.com/vijithassar/bisonica/compare/v0.1.9...v0.1.10) (2023-01-03)


### Features

* **core:** add audio sonification module ([de81dae](https://github.com/vijithassar/bisonica/commit/de81daec200e7eb3d9d6c87bb3c774725bfaa00d))
* **core:** add bar chart to benchmarks output ([4f4612c](https://github.com/vijithassar/bisonica/commit/4f4612c8ea3f635c016bcf6de728c8cebe7350be))
* **core:** add helper for rendering to detached node ([d1eddf1](https://github.com/vijithassar/bisonica/commit/d1eddf18b4cfeef4796591269fdf1aab0494c723))
* **core:** add table module ([beea5de](https://github.com/vijithassar/bisonica/commit/beea5def49df16a12399931cb24e5da781516054))
* **core:** add top level aria-description attribute with chart type ([ff8d33d](https://github.com/vijithassar/bisonica/commit/ff8d33d1c3c75c08217e18b4de13651e257fdecc))
* **core:** append extent description to aria-description attribute ([8b5a466](https://github.com/vijithassar/bisonica/commit/8b5a46696c7040fe0161dede22ea93ff91d57c18))
* **core:** circle point marks ([a841b11](https://github.com/vijithassar/bisonica/commit/a841b113d6da96b4ade743763656cf6aa367dd5e))
* **core:** configurable point fill ([e3bf295](https://github.com/vijithassar/bisonica/commit/e3bf295b781d30c1e255861e59af21349e1d0d4f))
* **core:** configurable point size ([664539b](https://github.com/vijithassar/bisonica/commit/664539b5b64839d3971488e65bdc28477cf33550))
* **core:** custom error handling ([ee138e3](https://github.com/vijithassar/bisonica/commit/ee138e381c838ec84b57c1d1aaa4e0bfa252dd03))
* **core:** encoding description ([52b775d](https://github.com/vijithassar/bisonica/commit/52b775d25d80a1aac263ccd72dccb3d3a431aabf))
* **core:** high contrast color order ([500dbf1](https://github.com/vijithassar/bisonica/commit/500dbf1962d83e955c133a60c6a0d8a1b9d1921c))
* **core:** image marks ([a1565eb](https://github.com/vijithassar/bisonica/commit/a1565eb316637e98be288c99d1f39d842de70580))
* **core:** interpret mark.size as fontSize for text marks ([7e105c4](https://github.com/vijithassar/bisonica/commit/7e105c4204b0f7b337bdc7a10575a8d6836b1bbf))
* **core:** keyboard navigation instructions ([55c64da](https://github.com/vijithassar/bisonica/commit/55c64da4f32a764442f6093ed0c6133e48ce6082))
* **core:** mark href property ([d62818d](https://github.com/vijithassar/bisonica/commit/d62818d837f92b3ed12642137aaa2b50d267b1a9))
* **core:** nested field lookup ([5e9047b](https://github.com/vijithassar/bisonica/commit/5e9047bf1cc57167959eebe93ae90ca52f99c6a7))
* **core:** provide accessible color palettes ([f2b43e3](https://github.com/vijithassar/bisonica/commit/f2b43e3eb164b59002ec285fb1f7732b06d16a8f))
* **core:** separate data binding from static text marks ([2524116](https://github.com/vijithassar/bisonica/commit/2524116ec42721427634e6fab26410292bbcb69d))
* **core:** square point marks ([8575aca](https://github.com/vijithassar/bisonica/commit/8575acae6cd59e57335bebfad4a8447d9ff58e50))
* **core:** transparent points ([cca179a](https://github.com/vijithassar/bisonica/commit/cca179a0fa21a72f00421a515b487283fa8768a2))


### Bug Fixes

* **core:** add aria-label descriptions to point marks ([3080ae6](https://github.com/vijithassar/bisonica/commit/3080ae6b6937cdcef1769a0d591133adc501c09b))
* **core:** add tabindex to svg ([0835d1a](https://github.com/vijithassar/bisonica/commit/0835d1ab21e67fac32fce5ba2a95ed645a1b5a8e))
* **core:** correct tick alignment for horizontal time series bar charts ([2b012e9](https://github.com/vijithassar/bisonica/commit/2b012e9abe9f754e5895ca2bdfcb9587d5f542b6))
* **core:** correct tick length for discrete encodings ([edf0463](https://github.com/vijithassar/bisonica/commit/edf04632daf7281df1d4b6aaac97d5173c2b20bc))
* **core:** detach initialization ([39ee036](https://github.com/vijithassar/bisonica/commit/39ee036419cb5d85db55c9a169e12e4e9701332f))
* **core:** disabling tooltips shouldn't disable descriptions ([2ef1024](https://github.com/vijithassar/bisonica/commit/2ef1024f37bb5962c2d427f9a0018c298130da6b))
* **core:** fix point data ([5452bd6](https://github.com/vijithassar/bisonica/commit/5452bd6309d10744564609ed379cb7114b1cfe64))
* **core:** include subtitle in top level aria-label description ([370aae4](https://github.com/vijithassar/bisonica/commit/370aae4ba8e211fc72d934c360494c1c42d6f88e))
* **core:** incorrect associativity in legend conditional ([9e46696](https://github.com/vijithassar/bisonica/commit/9e46696a2dd8f76df2948ebb588fc248fd129324))
* **core:** memoize computing longest tick ([452c387](https://github.com/vijithassar/bisonica/commit/452c3873dfa9bc57bcbbc9ae34edc6f4acb57460))
* **core:** more accurate legend test ([ed7d0bc](https://github.com/vijithassar/bisonica/commit/ed7d0bc7840db8454bf5703788ed5e1e37a0234e))
* **core:** only create legend node when necessary ([e8fbc50](https://github.com/vijithassar/bisonica/commit/e8fbc501bad5a6f8b061f0cc59ef50001851647d))
* **core:** optional encoding hash in feature tests ([bd1fabd](https://github.com/vijithassar/bisonica/commit/bd1fabdc8b7832ce12143292b5c5b743c2d1cbee))
* **core:** refactor metadata field transplanting ([8d6f2cc](https://github.com/vijithassar/bisonica/commit/8d6f2cc11323db93cb92c781880e4949dc86ed40))
* **core:** stricter isDiscrete helper ([c6527d7](https://github.com/vijithassar/bisonica/commit/c6527d735d69e3ef2563d36facf00a6e934a61f1))
* **core:** support multiple namespaces in detach helper ([5cc97b4](https://github.com/vijithassar/bisonica/commit/5cc97b4bb82d98a9bbeba23b339b08367917b9fb))
* **core:** type cast feature helper methods ([ed6c5f6](https://github.com/vijithassar/bisonica/commit/ed6c5f6c63d1acbd1422c135835823edc3bb72c5))
* **core:** use static accessors for circular chart layouts ([02fd863](https://github.com/vijithassar/bisonica/commit/02fd8637cb348cba07665669957a136e91a6cd84))
* **tests:** test internal functions ([3fb99e6](https://github.com/vijithassar/bisonica/commit/3fb99e6c19ac0bf9c1eada346541f756b0a71c43))
* **tooling:** add standard linter ([91095f2](https://github.com/vijithassar/bisonica/commit/91095f2cb33dc36c104ac1571f7be530929b3dab))

### [0.1.9](https://github.com/vijithassar/bisonica/compare/v0.1.8...v0.1.9) (2022-10-19)


### Bug Fixes

* **core:** pass specification to tooltip dispatcher ([1c3f82d](https://github.com/vijithassar/bisonica/commit/1c3f82dce840a4ad3169446d3827f124f2d5ae16))

### [0.1.8](https://github.com/vijithassar/bisonica/compare/v0.1.7...v0.1.8) (2022-10-12)


### Bug Fixes

* **core:** add Cartesian covariate helper ([1fcff04](https://github.com/vijithassar/bisonica/commit/1fcff041361b43159c32686e64508ac9d9ed7acb))
* **core:** generic layer function call utility ([201a510](https://github.com/vijithassar/bisonica/commit/201a5100f7ea6a6e346b2387f0320f2c1f24fa6a))
* **core:** preserve single series properties based on encoding ([a7b8af0](https://github.com/vijithassar/bisonica/commit/a7b8af07357418f54212a88504536c7f9fc7d591)), closes [#54](https://github.com/vijithassar/bisonica/issues/54) [#58](https://github.com/vijithassar/bisonica/issues/58)

### [0.1.7](https://github.com/vijithassar/bisonica/compare/v0.1.6...v0.1.7) (2022-09-28)


### Features

* **core:** disable scales with null ([c2ca00e](https://github.com/vijithassar/bisonica/commit/c2ca00e0ae4540cd05baec728a509b4861d35c30))
* **core:** layer interactions ([7e40ee8](https://github.com/vijithassar/bisonica/commit/7e40ee88cb20fea6699bd390bf5a97283fc7ef7f))
* **tooling:** add benchmarks ([2ab1f9e](https://github.com/vijithassar/bisonica/commit/2ab1f9eb6bd67a4db72bd8422565438778fcd41c))
* **tooling:** check code coverage ([468fbc6](https://github.com/vijithassar/bisonica/commit/468fbc60582d0c526c3f9f3565162785d4a35afd))
* **tooling:** run tests in ci ([3003f6d](https://github.com/vijithassar/bisonica/commit/3003f6d71d7ecef5eb81cb1f8df25677567f0cac))


### Bug Fixes

* **core:** allow encodings in text layers ([5719898](https://github.com/vijithassar/bisonica/commit/571989856f60feab53fabc40f9fdf7af0d118378))
* **core:** check marks for tooltips ([4858d70](https://github.com/vijithassar/bisonica/commit/4858d70376f318ae83c9d9b451c4f6da01d62335))
* **core:** extension helper ([b5d2dde](https://github.com/vijithassar/bisonica/commit/b5d2dde3b2502eab291d87253ebb93a251c0178f))
* **core:** handle datum encodings in url lookup ([d065f41](https://github.com/vijithassar/bisonica/commit/d065f41d6d93c30adae05ae6c4a12a4303d6f473))
* **core:** looser check for href encodings ([53b33d4](https://github.com/vijithassar/bisonica/commit/53b33d4f3d9563b069a676a93ea59e7ca4855300))
* **core:** more accurate check for links when rendering text layers ([cc7f1d6](https://github.com/vijithassar/bisonica/commit/cc7f1d651f82c33d8367ffe9a659dc764a49449f))
* **core:** prohibit static marks in primary layers ([abcfb49](https://github.com/vijithassar/bisonica/commit/abcfb495107e1c5cece74f1ffc7f3899873481b3))
* **core:** radial feature test method ([56c9355](https://github.com/vijithassar/bisonica/commit/56c9355bf344db2a0797070bde37516dc8b1d930))
* **core:** retain original stack trace for tooltip errors ([867a5d5](https://github.com/vijithassar/bisonica/commit/867a5d5e486b90cd5ea4270fd7bfe6af4658cdda))
* **core:** synthetic scale helper for tracking domain and range ([0ef6d61](https://github.com/vijithassar/bisonica/commit/0ef6d6138752cce5028f71f12c119560229f70fd))
* **tooling:** mock image APIs ([f0ff179](https://github.com/vijithassar/bisonica/commit/f0ff17919efdbe518e68b1b49e769b3ee424cee6))
* **tooling:** use faster specification objects in tests ([34bd171](https://github.com/vijithassar/bisonica/commit/34bd171f535194db158f691a83856c35d51dc752))

### [0.1.6](https://github.com/vijithassar/bisonica/compare/v0.1.5...v0.1.6) (2022-08-28)


### Features

* **core:** symmetric log scales ([4e30566](https://github.com/vijithassar/bisonica/commit/4e305666c633e175d592aa07bfee797595b1a879))


### Bug Fixes

* **core**: temporarily revert single series mapping ([70d3840](https://github.com/vijithassar/bisonica/commit/70d38408c7b9e8b599fb03942e0dcdc41597ff78))


### [0.1.5](https://github.com/vijithassar/bisonica/compare/v0.1.4...v0.1.5) (2022-08-15)


### Bug Fixes

* **core:** temporal bar dimensions helper ([c806e27](https://github.com/vijithassar/bisonica/commit/c806e27f32bd765c4203f7b44653a3d5b418664b))

### [0.1.4](https://github.com/vijithassar/bisonica/compare/v0.1.3...v0.1.4) (2022-08-15)


### Bug Fixes

* **core:** preserve single series properties based on encoding ([9b15075](https://github.com/vijithassar/bisonica/commit/9b15075bf2b2972b64d2981eb20749ab8baf9e59))

### [0.1.3](https://github.com/vijithassar/bisonica/compare/v0.1.2...v0.1.3) (2022-08-12)


### Features

* **core:** add unioned color ranges to primary layers ([e00976a](https://github.com/vijithassar/bisonica/commit/e00976ad672726878c9a33fc0c8d7b849d74b002))

### [0.1.2](https://github.com/vijithassar/bisonica/compare/v0.1.1...v0.1.2) (2022-08-10)


### Bug Fixes

* **core:** flexible direction for tooltip values ([abefdf9](https://github.com/vijithassar/bisonica/commit/abefdf98675e4120497d7a54fe3bc8fe097e6a63))

### 0.1.1 (2022-07-27)


### Features

* **core:** point scales ([d3dc0b4](https://github.com/vijithassar/bisonica/commit/d3dc0b4c7f8daf70ad07790bd4e19c65b97eebb2))
* **core** single bar ([bcd0a56](https://github.com/vijithassar/bisonica/commit/bcd0a56ab9a4c27c955ebb6682a8968fcd4a9683))
* **core** area charts ([ddcb62d](https://github.com/vijithassar/bisonica/commit/ddcb62d020d683e63e22d4c61720b6fbdad6e7b5))
* **core:** bidirectional bar encoding ([51ff4d2](https://github.com/vijithassar/bisonica/commit/51ff4d2f2b9af978a167381ac23565095fbf3a4a))


### Bug Fixes

* **core:** always process periods in temporal domains ([3287755](https://github.com/vijithassar/bisonica/commit/3287755fff2440b799775a8b28f4490ee11ec497))
* **core** unknown encoding type errors ([fb3ed75](https://github.com/vijithassar/bisonica/commit/fb3ed756eef521df28f239bbdf4699f65b10d0c4))
* **core** primary layer view helper ([a2f6622](https://github.com/vijithassar/bisonica/commit/a2f662249414ab69cfa1f2f9f237d07998e0126b))
* **core** text mark link fix ([25292ae](https://github.com/vijithassar/bisonica/commit/25292aeaa89ddd27df21d21f7c3f5959abb2d65e))

## 0.1.0 (2022-07-06)


### Features

* **chore:** add chart renderer ([fd12666](https://github.com/vijithassar/bisonica/commit/fd126665991e86a394e2135093b16c70c48227b7))
* **tooling:** add continuous integration checks ([4ed9d54](https://github.com/vijithassar/bisonica/commit/4ed9d54b8a667120ffc8e040e63117c0032371b0))


### Bug Fixes

* **core:** fix memoization by reference for function arguments ([a3a0adb](https://github.com/vijithassar/bisonica/commit/a3a0adbc776ee0b3797adaac1236085b3bd4ceb2))
* **core:** rename package ([cda7a91](https://github.com/vijithassar/bisonica/commit/cda7a91cce36b0b66784c4c68bd9f160e4437929))
* **docs:** add CONTRIBUTING.md ([74035c6](https://github.com/vijithassar/bisonica/commit/74035c677c5f2df21ef4bb968897c8a28600be2f))
* **docs:** add license ([f6f3884](https://github.com/vijithassar/bisonica/commit/f6f38842ef5cf1abdddcafc258346e62ccfd83b4))
* **docs:** add README.md ([8339707](https://github.com/vijithassar/bisonica/commit/83397075e7f89ac9fd802066f6184a625beb5acd))
* **tests:** add test runner ([e83f40c](https://github.com/vijithassar/bisonica/commit/e83f40ccc797f6113d68c7f9330f93e236c63dc3))
* **tests:** add test script ([97e06dc](https://github.com/vijithassar/bisonica/commit/97e06dcc1659032e3611c4541767bb17f9b86580))
* **tooling:** add build ([b893b66](https://github.com/vijithassar/bisonica/commit/b893b661363bdb6c589028862fff473a7363bdf6))
* **tooling:** add commit linting ([b507193](https://github.com/vijithassar/bisonica/commit/b507193b474ddc4392fe997ff7b025ba698f90df))
* **tooling:** add exports ([0d4a544](https://github.com/vijithassar/bisonica/commit/0d4a54466767a2ea3e576d504854a0994d300aef))
* **tooling:** add matchAll shim ([d1cb82b](https://github.com/vijithassar/bisonica/commit/d1cb82bd286ebcc4b77f2423b51affb1c9e3d696))
* **tooling:** add package.json ([2e3518e](https://github.com/vijithassar/bisonica/commit/2e3518eabedb87ef43a504ecbbdcacfa195cd220))
* **tooling:** add type checking script ([e2d6cd6](https://github.com/vijithassar/bisonica/commit/e2d6cd6685c1c3070250d1e0af8617b174aa327d))
* **tooling:** custom lint rules ([fec8606](https://github.com/vijithassar/bisonica/commit/fec8606e6c29add264ec094dd4f05a12ebb3292e))
* **tooling:** lint JavaScript ([fd59771](https://github.com/vijithassar/bisonica/commit/fd59771d8e8bd5f65605c16413604e5cfe362d20))
* **tooling:** substitute isPresent() ([c63a757](https://github.com/vijithassar/bisonica/commit/c63a757bac10e93f95961d81eff86d00ab1bfee6))
