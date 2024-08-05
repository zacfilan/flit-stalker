#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <arpa/inet.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <ifaddrs.h>
#include <netinet/in.h>
#include <net/if.h>

#define PORT 3000
#define BUFFER_SIZE 1024

const char *get_mime_type(const char *ext) {
    if (strcmp(ext, "html") == 0) return "text/html";
    if (strcmp(ext, "css") == 0) return "text/css";
    if (strcmp(ext, "js") == 0) return "application/javascript";
    if (strcmp(ext, "png") == 0) return "image/png";
    if (strcmp(ext, "jpg") == 0) return "image/jpeg";
    if (strcmp(ext, "gif") == 0) return "image/gif";
    return "application/octet-stream";
}

void handle_client(int client_socket) {
    char buffer[BUFFER_SIZE];
    int bytes_read = read(client_socket, buffer, sizeof(buffer) - 1);
    if (bytes_read < 0) {
        perror("read");
        close(client_socket);
        return;
    }
    buffer[bytes_read] = '\0';

    // Parse the request line
    char method[16], path[256];
    sscanf(buffer, "%s %s", method, path);

    // Default to index.html if root is requested
    if (strcmp(path, "/") == 0) {
        strcpy(path, "/index.html");
    }

    // Remove leading slash
    memmove(path, path + 1, strlen(path));

    // Get file extension
    char *ext = strrchr(path, '.');
    if (ext) {
        ext++;
    } else {
        ext = "";
    }

    // Get MIME type
    const char *mime_type = get_mime_type(ext);

    // Open the file
    int file_fd = open(path, O_RDONLY);
    if (file_fd < 0) {
        // File not found
        const char *not_found_response = "HTTP/1.1 404 Not Found\r\nContent-Type: text/plain\r\n\r\nNot Found";
        write(client_socket, not_found_response, strlen(not_found_response));
        close(client_socket);
        return;
    }

    // Get file size
    struct stat file_stat;
    fstat(file_fd, &file_stat);
    int file_size = file_stat.st_size;

    // Send response headers
    char response_headers[BUFFER_SIZE];
    snprintf(response_headers, sizeof(response_headers),
             "HTTP/1.1 200 OK\r\nContent-Type: %s\r\nContent-Length: %d\r\n\r\n",
             mime_type, file_size);
    write(client_socket, response_headers, strlen(response_headers));

    // Send file content
    while ((bytes_read = read(file_fd, buffer, sizeof(buffer))) > 0) {
        write(client_socket, buffer, bytes_read);
    }

    close(file_fd);
    close(client_socket);
}

char *get_external_ip(const char *interface) {
    struct ifaddrs *ifaddr, *ifa;
    int family;
    static char ip[INET_ADDRSTRLEN];

    if (getifaddrs(&ifaddr) == -1) {
        perror("getifaddrs");
        exit(EXIT_FAILURE);
    }

    for (ifa = ifaddr; ifa != NULL; ifa = ifa->ifa_next) {
        if (ifa->ifa_addr == NULL) continue;

        family = ifa->ifa_addr->sa_family;

        if (family == AF_INET && strcmp(ifa->ifa_name, interface) == 0) {
            if (inet_ntop(family, &((struct sockaddr_in *)ifa->ifa_addr)->sin_addr, ip, sizeof(ip)) == NULL) {
                perror("inet_ntop");
                exit(EXIT_FAILURE);
            }
            break;
        }
    }

    freeifaddrs(ifaddr);
    return ip;
}

int main() {
    int server_socket = socket(AF_INET, SOCK_STREAM, 0);
    if (server_socket < 0) {
        perror("socket");
        exit(EXIT_FAILURE);
    }

    struct sockaddr_in server_addr;
    server_addr.sin_family = AF_INET;
    server_addr.sin_addr.s_addr = INADDR_ANY;
    server_addr.sin_port = htons(PORT);

    if (bind(server_socket, (struct sockaddr *)&server_addr, sizeof(server_addr)) < 0) {
        perror("bind");
        close(server_socket);
        exit(EXIT_FAILURE);
    }

    if (listen(server_socket, 10) < 0) {
        perror("listen");
        close(server_socket);
        exit(EXIT_FAILURE);
    }

    char *external_ip = get_external_ip("eth0");
    printf("Server running at http://%s:%d/\n", external_ip, PORT);

    while (1) {
        int client_socket = accept(server_socket, NULL, NULL);
        if (client_socket < 0) {
            perror("accept");
            continue;
        }
        handle_client(client_socket);
    }

    close(server_socket);
    return 0;
}