input metauml;
beginfig(1);
	Actor.admin("Administrator");
	Actor.leiter("Ubungsleiter");
	Actor.tutor("Tutor");
	Actor.tutant("Tutant");

	Usecase.U("asdf asdf s", "unten");

	leftToRight(50)(admin, leiter, tutor, tutant);
	topToBottom(30)(admin, U);
	drawObjects(U, admin, leiter, tutor, tutant);

	link(inheritance)(pathStepX(admin.s, U.n, 0));

endfig;
end
