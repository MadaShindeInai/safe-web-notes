init:
	pnpm i && npx prisma generate
i: init
s:
	pnpm dev
studio:
	npx prisma studio
db:
	npx prisma generate
f:
	npx prisma format
migration:
	npx prisma migrate dev
b:
	pnpm build
pnpm:
	corepack use pnpm@latest
clean:
	rm -rf .next tsconfig.tsbuildinfo
c: clean
remove_modules:
	rm -rf node_modules
c: clean
r: clean remove_modules init