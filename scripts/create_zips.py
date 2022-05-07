#!/usr/bin/python3

import argparse
import json
import os
import zipfile


def create_zip_file(zip_name, file_list, dist_folder):
    """
    Create a zip archive from the list of files

    :param str zip_name: The name of the zip
    :param list file_list: The list of files and paths to zip
    :param str dist_folder: The dist folder
    :return: None
    """
    with zipfile.ZipFile(zip_name, "w", zipfile.ZIP_DEFLATED) as zipf:
        for path in file_list:
            if os.path.isdir(path):
                for root, _, files in os.walk(path):
                    for file in files:
                        write_file_to_zip(file, root, dist_folder, zipf)
            else:
                write_file_to_zip(path, "", dist_folder, zipf)


def write_file_to_zip(file, root, dist_folder, zipf):
    """
    Writes the specified file to the zip

    :param str file: The name of the file to write
    :param str root: The root directory of the file
    :param str dist_folder: The dist folder
    :param zipfile.ZipFile zipf: The zip to write to
    :return: None
    """
    full_file_path = os.path.join(root, file)
    file_without_dist = full_file_path
    if dist_folder in full_file_path:
        _, file_without_dist = full_file_path.split(dist_folder)
    zipf.write(full_file_path, file_without_dist)


def main():
    parser = argparse.ArgumentParser(
        description="Create releasable zip files",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument("-d", "--dist-folder", help="The dist folder", default="dist")
    parser.add_argument(
        "-m",
        "--manifest",
        help="The path to the manifest file",
        default="manifest.json",
    )
    args = parser.parse_args()

    with open(args.manifest, "r") as manifest_file:
        manifest_data = json.load(manifest_file)
        release_version = manifest_data["version"]

    create_zip_file(
        "BiblePreview.v{}.zip".format(release_version),
        [args.dist_folder],
        args.dist_folder,
    )

    create_zip_file(
        "BiblePreviewSource.zip",
        [
            "js",
            "css",
            "html",
            "icons",
            "scripts",
            "README.md",
            "manifest.json",
            "package.json",
            "build_versions.txt",
        ],
        args.dist_folder,
    )


if __name__ == "__main__":
    main()
