---
sidebar_position: 4
sidebar_label: Creating adapters
pagination_label: Creating file-storage adapters
tags:
    - FileStorage
    - Creating adapters
    - Creating database adapters
keywords:
    - FileStorage
    - Creating adapters
    - Creating database adapters
---

# Creating lock adapters

## Implementing your custom IFileStorageAdapter

In order to create an adapter you need to implement the [`IFileStorageAdapter`](https://daiso-tech.github.io/daiso-core/types/FileStorage.IFileStorageAdapter.html) contract.

## Implementing your custom ISignedFileStorageAdapter

We provide an additional contract [`ISignedFileStorageAdapter`](https://daiso-tech.github.io/daiso-core/types/FileStorage.ISignedFileStorageAdapter.html) for building custom file-storage adapters with support for creating signed download and upload urls.

## Implementing your custom IFileStorage class

In some cases, you may need to implement a custom [`FileStorage`](https://daiso-tech.github.io/daiso-core/classes/FileStorage.FileStorage.html) class to optimize performance for your specific technology stack. You can then directly implement the [`IFileStorage`](https://daiso-tech.github.io/daiso-core/types/FileStorage.IFileStorage.html) contract.

## Further information

For further information refer to [`@daiso-tech/core/file-storage`](https://daiso-tech.github.io/daiso-core/modules/FileStorage.html) API docs.
