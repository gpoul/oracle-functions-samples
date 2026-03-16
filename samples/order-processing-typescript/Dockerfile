FROM fnproject/node:20-dev as build-stage
WORKDIR /function
ADD package.json /function/
ADD func.ts /function/
RUN npm install  && chown -R $(id -u):$(id -g) node_modules && npm run build
FROM fnproject/node:20
WORKDIR /function
# Might want to add package lock file also for prod builds
ADD package.json /function/
# Instead of copy node_modules we reinstall without dev dependencies to get a smaller image
RUN npm install --omit=dev && chown -R $(id -u):$(id -g) node_modules && du -hs /function
# Copy the built JavaScript sources from build-stage
COPY --from=build-stage /function/dist/ /function/
RUN chmod -R o+r /function
ENTRYPOINT ["node", "--enable-source-maps", "func.js"]
